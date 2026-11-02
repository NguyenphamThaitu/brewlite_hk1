import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CalculationLineItem {
  productId: number;
  size: string;
  toppings?: string[];
  qty: number;
}

export interface IngredientRequirementSummary {
  ingredientId: number;
  ingredientName: string;
  unit: string;
  required: number;
  stock: number;
  reserved: number;
  available: number;
  shortage: number;
  projectedRemaining: number;
  canFulfill: boolean;
}

export interface CalculationResult {
  canFulfillAll: boolean;
  ingredients: IngredientRequirementSummary[];
}

@Injectable()
export class InventoryCalculationService {
  constructor(private prisma: PrismaService) {}

  /**
   * Tính toán tổng định lượng nguyên liệu cần dùng từ danh sách món,
   * gộp nguyên liệu dùng chung và đối chiếu tồn kho khả dụng.
   */
  async calculate(items: CalculationLineItem[]): Promise<CalculationResult> {
    const aggregatedMap = await this.aggregateRequirements(items);

    if (aggregatedMap.size === 0) {
      return { canFulfillAll: true, ingredients: [] };
    }

    const ingredientIds = Array.from(aggregatedMap.keys());
    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });

    const ingById = new Map(ingredients.map((ing) => [ing.id, ing]));
    const summaries: IngredientRequirementSummary[] = [];
    let canFulfillAll = true;

    for (const [ingredientId, requiredAmount] of aggregatedMap.entries()) {
      const ing = ingById.get(ingredientId);
      if (!ing) {
        throw new NotFoundException(`Nguyên liệu ID ${ingredientId} không tồn tại`);
      }

      const stockNum = Number(ing.stock);
      const reservedNum = Number(ing.reservedQty);
      const availableNum = Math.max(0, Number((stockNum - reservedNum).toFixed(2)));
      const requiredNum = Number(requiredAmount.toFixed(2));
      const shortageNum = Math.max(0, Number((requiredNum - availableNum).toFixed(2)));
      const canFulfill = availableNum >= requiredNum;
      const projectedRemaining = canFulfill
        ? Number((availableNum - requiredNum).toFixed(2))
        : 0;

      if (!canFulfill) {
        canFulfillAll = false;
      }

      summaries.push({
        ingredientId,
        ingredientName: ing.name,
        unit: ing.unit,
        required: requiredNum,
        stock: stockNum,
        reserved: reservedNum,
        available: availableNum,
        shortage: shortageNum,
        projectedRemaining,
        canFulfill,
      });
    }

    // Sắp xếp theo tên nguyên liệu để bảng hiển thị ổn định
    summaries.sort((a, b) => a.ingredientName.localeCompare(b.ingredientName, 'vi'));

    return {
      canFulfillAll,
      ingredients: summaries,
    };
  }

  /**
   * Tính gộp định lượng nguyên liệu cần thiết theo từng ingredientId.
   * Kiểm tra và từ chối nếu có biến thể thiếu công thức.
   */
  async aggregateRequirements(
    items: CalculationLineItem[],
  ): Promise<Map<number, number>> {
    const aggregated = new Map<number, number>();

    // 1. Tải toàn bộ công thức món và topping cần thiết
    const productIds = [...new Set(items.map((i) => i.productId))];
    const recipeItems = await this.prisma.recipeItem.findMany({
      where: { productId: { in: productIds } },
      include: { product: true, ingredient: true },
    });

    // Gom công thức theo "productId_size"
    const recipeMap = new Map<string, typeof recipeItems>();
    for (const r of recipeItems) {
      const key = `${r.productId}_${r.size.toUpperCase()}`;
      const list = recipeMap.get(key) ?? [];
      list.push(r);
      recipeMap.set(key, list);
    }

    // Tải toàn bộ công thức topping
    const allToppings = items.flatMap((i) => i.toppings ?? []);
    const uniqueToppings = [...new Set(allToppings)];
    const toppingRecipes = await this.prisma.toppingRecipe.findMany({
      where: { toppingName: { in: uniqueToppings } },
      include: { ingredient: true },
    });

    const toppingMap = new Map<string, typeof toppingRecipes>();
    for (const t of toppingRecipes) {
      const list = toppingMap.get(t.toppingName) ?? [];
      list.push(t);
      toppingMap.set(t.toppingName, list);
    }

    // 2. Duyệt từng dòng sản phẩm
    for (const line of items) {
      const sizeKey = `${line.productId}_${line.size.toUpperCase()}`;
      const recipes = recipeMap.get(sizeKey);

      if (!recipes || recipes.length === 0) {
        throw new BadRequestException(
          `Chưa cấu hình công thức cho sản phẩm ID ${line.productId} (Size ${line.size})`,
        );
      }

      // Cộng định lượng đồ uống
      for (const r of recipes) {
        const lineAmount = Number(r.amount) * line.qty;
        aggregated.set(r.ingredientId, (aggregated.get(r.ingredientId) ?? 0) + lineAmount);
      }

      // Cộng định lượng topping
      if (line.toppings && line.toppings.length > 0) {
        for (const toppingName of line.toppings) {
          const tRecipes = toppingMap.get(toppingName);
          if (tRecipes && tRecipes.length > 0) {
            for (const t of tRecipes) {
              const toppingAmount = Number(t.amount) * line.qty;
              aggregated.set(
                t.ingredientId,
                (aggregated.get(t.ingredientId) ?? 0) + toppingAmount,
              );
            }
          }
        }
      }
    }

    return aggregated;
  }

  /**
   * Ước tính số ly tối đa cho riêng một biến thể (sản phẩm + size + toppings) trong điều kiện cô lập.
   * Ghi chú rõ: ước tính độc lập, không cộng dồn giữa các món chia sẻ nguyên liệu.
   */
  async estimateVariantAvailableCups(
    productId: number,
    size: string,
    toppings: string[] = [],
  ): Promise<{
    available: boolean;
    isolatedAvailableCups: number;
    limitingIngredient?: string;
    note: string;
  }> {
    const singleCupRequirement = await this.aggregateRequirements([
      { productId, size, toppings, qty: 1 },
    ]);

    const ingredientIds = Array.from(singleCupRequirement.keys());
    const ingredients = await this.prisma.ingredient.findMany({
      where: { id: { in: ingredientIds } },
    });

    const ingMap = new Map(ingredients.map((i) => [i.id, i]));
    let minCups = Number.MAX_SAFE_INTEGER;
    let limitingIngredientName: string | undefined;

    for (const [ingredientId, amountNeeded] of singleCupRequirement.entries()) {
      const ing = ingMap.get(ingredientId);
      if (!ing) {
        return {
          available: false,
          isolatedAvailableCups: 0,
          note: 'Thiếu thông tin nguyên liệu trong kho',
        };
      }
      const available = Math.max(0, Number(ing.stock) - Number(ing.reservedQty));
      const cupsForThis = Math.floor(available / amountNeeded);

      if (cupsForThis < minCups) {
        minCups = cupsForThis;
        limitingIngredientName = ing.name;
      }
    }

    const isolatedAvailableCups = minCups === Number.MAX_SAFE_INTEGER ? 0 : minCups;

    return {
      available: isolatedAvailableCups >= 1,
      isolatedAvailableCups,
      limitingIngredient: limitingIngredientName,
      note: 'Ước tính số ly tối đa cho riêng tùy chọn này trong điều kiện không chia sẻ nguyên liệu với các món khác. Không thể cộng dồn ước tính giữa các món.',
    };
  }
}
