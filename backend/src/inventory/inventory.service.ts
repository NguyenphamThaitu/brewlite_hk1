import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { MovementType, OrderStatus, Prisma, ReservationStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StockInDto } from './dto/stock-in.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import {
  UpdateProductSizeRecipeDto,
  UpdateToppingRecipeDto,
} from './dto/update-recipe.dto';

@Injectable()
export class InventoryService implements OnModuleInit {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // Dọn dẹp các đơn hết hạn giữ chỗ sau khi backend khởi động lại
    try {
      const cleaned = await this.expireReservationsCleanup();
      if (cleaned > 0) {
        this.logger.log(`Đã giải phóng ${cleaned} đơn hàng hết hạn giữ chỗ khi khởi động backend`);
      }
    } catch (e) {
      this.logger.error('Lỗi khi quét đơn hàng hết hạn giữ chỗ lúc khởi động', e);
    }
  }

  /**
   * Danh sách nguyên liệu kèm số dư thực tế, số lượng giữ chỗ, khả dụng và cảnh báo sắp hết
   */
  async findAllIngredients() {
    const items = await this.prisma.ingredient.findMany({
      orderBy: { id: 'asc' },
    });

    return items.map((ing) => {
      const stock = Number(ing.stock);
      const reserved = Number(ing.reservedQty);
      const available = Math.max(0, Number((stock - reserved).toFixed(2)));
      const threshold = Number(ing.lowStockThreshold);
      const isLowStock = stock <= threshold;

      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        stock,
        reservedQty: reserved,
        availableQty: available,
        lowStockThreshold: threshold,
        isLowStock,
        version: ing.version,
      };
    });
  }

  /**
   * Nhập kho nguyên liệu (Stock-In)
   */
  async stockIn(dto: StockInDto) {
    const qty = Number(dto.quantity);
    if (qty <= 0) {
      throw new BadRequestException('Số lượng nhập kho phải lớn hơn 0');
    }

    return this.prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.findUnique({
        where: { id: dto.ingredientId },
      });
      if (!ing) {
        throw new NotFoundException(`Nguyên liệu ID ${dto.ingredientId} không tồn tại`);
      }

      const updated = await tx.ingredient.update({
        where: { id: dto.ingredientId },
        data: {
          stock: { increment: qty },
          version: { increment: 1 },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          ingredientId: ing.id,
          type: MovementType.STOCK_IN,
          quantity: qty,
          balanceAfter: updated.stock,
          reason: dto.reason?.trim() || 'Nhập thêm nguyên liệu vào kho',
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        stock: Number(updated.stock),
        reservedQty: Number(updated.reservedQty),
        availableQty: Number(updated.stock) - Number(updated.reservedQty),
      };
    });
  }

  /**
   * Điều chỉnh kiểm kê tồn kho (Stock Adjustment) có giải trình bắt buộc
   */
  async adjustStock(dto: AdjustStockDto) {
    const targetStock = Number(dto.actualStock);
    if (targetStock < 0) {
      throw new BadRequestException('Tồn kho thực tế không thể âm');
    }

    return this.prisma.$transaction(async (tx) => {
      const ing = await tx.ingredient.findUnique({
        where: { id: dto.ingredientId },
      });
      if (!ing) {
        throw new NotFoundException(`Nguyên liệu ID ${dto.ingredientId} không tồn tại`);
      }

      const currentStock = Number(ing.stock);
      const currentReserved = Number(ing.reservedQty);

      if (targetStock < currentReserved) {
        throw new ConflictException(
          `Không thể điều chỉnh tồn kho về ${targetStock} vì đang có ${currentReserved} ${ing.unit} được giữ chỗ cho các đơn đang chờ thanh toán`,
        );
      }

      const diff = targetStock - currentStock;
      const updated = await tx.ingredient.update({
        where: { id: dto.ingredientId },
        data: {
          stock: targetStock,
          version: { increment: 1 },
        },
      });

      await tx.inventoryMovement.create({
        data: {
          ingredientId: ing.id,
          type: MovementType.ADJUSTMENT,
          quantity: diff, // Có thể âm hoặc dương
          balanceAfter: targetStock,
          reason: dto.reason.trim(),
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        stock: Number(updated.stock),
        reservedQty: Number(updated.reservedQty),
        availableQty: Number(updated.stock) - Number(updated.reservedQty),
        adjustmentDiff: diff,
      };
    });
  }

  /**
   * Xem toàn bộ công thức món và topping
   */
  async getAllRecipes() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        recipeItems: {
          include: { ingredient: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    const toppings = await this.prisma.toppingRecipe.findMany({
      include: { ingredient: true },
      orderBy: { toppingName: 'asc' },
    });

    return {
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        recipes: p.recipeItems.map((r) => ({
          id: r.id,
          size: r.size,
          ingredientId: r.ingredientId,
          ingredientName: r.ingredient.name,
          unit: r.ingredient.unit,
          amount: Number(r.amount),
        })),
      })),
      toppings: toppings.map((t) => ({
        id: t.id,
        toppingName: t.toppingName,
        ingredientId: t.ingredientId,
        ingredientName: t.ingredient.name,
        unit: t.ingredient.unit,
        amount: Number(t.amount),
      })),
    };
  }

  /**
   * Cập nhật công thức cho một sản phẩm theo size
   */
  async updateProductSizeRecipe(dto: UpdateProductSizeRecipeDto) {
    return this.prisma.$transaction(async (tx) => {
      const prod = await tx.product.findUnique({ where: { id: dto.productId } });
      if (!prod) throw new NotFoundException('Không tìm thấy sản phẩm');

      // Xóa công thức cũ của size này
      await tx.recipeItem.deleteMany({
        where: { productId: dto.productId, size: dto.size },
      });

      // Tạo công thức mới
      for (const item of dto.ingredients) {
        await tx.recipeItem.create({
          data: {
            productId: dto.productId,
            size: dto.size,
            ingredientId: item.ingredientId,
            amount: item.amount,
          },
        });
      }

      return { success: true, productId: dto.productId, size: dto.size };
    });
  }

  /**
   * Cập nhật công thức cho topping
   */
  async updateToppingRecipe(dto: UpdateToppingRecipeDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.toppingRecipe.deleteMany({
        where: { toppingName: dto.toppingName },
      });

      for (const item of dto.ingredients) {
        await tx.toppingRecipe.create({
          data: {
            toppingName: dto.toppingName,
            ingredientId: item.ingredientId,
            amount: item.amount,
          },
        });
      }

      return { success: true, toppingName: dto.toppingName };
    });
  }

  /**
   * Tiêu hao tồn kho từ các reservation đã giữ chỗ (chạy trong transaction của thanh toán thành công)
   */
  async consumeOrderReservationsTx(
    tx: Prisma.TransactionClient,
    orderId: number,
  ) {
    const reservations = await tx.orderIngredientReservation.findMany({
      where: { orderId, status: ReservationStatus.RESERVED },
      include: { ingredient: true },
    });

    for (const res of reservations) {
      const amount = Number(res.amount);
      const updated = await tx.ingredient.update({
        where: { id: res.ingredientId },
        data: {
          stock: { decrement: amount },
          reservedQty: { decrement: amount },
          version: { increment: 1 },
        },
      });

      await tx.orderIngredientReservation.update({
        where: { id: res.id },
        data: { status: ReservationStatus.CONSUMED },
      });

      await tx.inventoryMovement.create({
        data: {
          ingredientId: res.ingredientId,
          type: MovementType.CONSUMPTION,
          quantity: amount,
          balanceAfter: updated.stock,
          orderId,
          reason: `Pha chế đồ uống cho đơn hàng #${orderId}`,
        },
      });
    }
  }

  /**
   * Giải phóng giữ chỗ (chạy khi đơn bị hủy hoặc hết hạn thanh toán trước khi tiêu hao)
   */
  async releaseOrderReservationsTx(
    tx: Prisma.TransactionClient,
    orderId: number,
    reason: string = 'Đơn hàng bị hủy hoặc hết hạn giữ chỗ',
  ) {
    const reservations = await tx.orderIngredientReservation.findMany({
      where: { orderId, status: ReservationStatus.RESERVED },
    });

    for (const res of reservations) {
      const amount = Number(res.amount);
      await tx.ingredient.update({
        where: { id: res.ingredientId },
        data: {
          reservedQty: { decrement: amount },
          version: { increment: 1 },
        },
      });

      await tx.orderIngredientReservation.update({
        where: { id: res.id },
        data: { status: ReservationStatus.RELEASED },
      });
    }

    this.logger.log(`Đã giải phóng giữ chỗ cho đơn #${orderId}: ${reason}`);
  }

  /**
   * Hết hạn một đơn hàng cụ thể
   */
  async expireOrderReservation(orderId: number) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { reservations: true },
      });
      if (!order || order.status === OrderStatus.PAID || order.status === OrderStatus.CANCELLED) {
        return;
      }

      await tx.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      await this.releaseOrderReservationsTx(
        tx,
        orderId,
        'Hết thời hạn thanh toán (10 phút)',
      );
    });
  }

  /**
   * Dọn dẹp tất cả đơn hàng đã quá hạn giữ chỗ
   */
  async expireReservationsCleanup(): Promise<number> {
    const now = new Date();
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: { in: [OrderStatus.PENDING, OrderStatus.PAYMENT_FAILED] },
        reservationExpiresAt: { lt: now },
      },
      select: { id: true },
    });

    for (const ord of expiredOrders) {
      await this.expireOrderReservation(ord.id);
    }

    return expiredOrders.length;
  }

  /**
   * Báo cáo cân đối xuất-nhập-tồn theo ngày (Asia/Ho_Chi_Minh: UTC+7)
   */
  async getDailyReport(dateStr?: string) {
    // Xác định mốc thời gian theo múi giờ Việt Nam (UTC+7)
    let targetDate: Date;
    if (dateStr && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      // YYYY-MM-DD
      const [y, m, d] = dateStr.split('-').map(Number);
      targetDate = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    } else {
      // Mặc định là ngày hôm nay theo giờ VN
      const nowUtc = Date.now();
      const vnTime = new Date(nowUtc + 7 * 60 * 60 * 1000);
      targetDate = new Date(
        Date.UTC(vnTime.getUTCFullYear(), vnTime.getUTCMonth(), vnTime.getUTCDate(), 0, 0, 0),
      );
    }

    // dayStart: 00:00:00 UTC+7 => 17:00:00 UTC hôm trước
    // dayEnd: 23:59:59.999 UTC+7 => 16:59:59.999 UTC ngày hôm đó
    const dayStart = new Date(targetDate.getTime() - 7 * 60 * 60 * 1000);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000 - 1);

    const reportDateStr = new Date(targetDate.getTime())
      .toISOString()
      .split('T')[0];

    const ingredients = await this.prisma.ingredient.findMany({
      orderBy: { id: 'asc' },
    });

    // Tải tất cả movements của các nguyên liệu
    const allMovements = await this.prisma.inventoryMovement.findMany({
      where: { createdAt: { lte: dayEnd } },
      orderBy: { createdAt: 'asc' },
    });

    const movementsByIngredient = new Map<number, typeof allMovements>();
    for (const m of allMovements) {
      const list = movementsByIngredient.get(m.ingredientId) ?? [];
      list.push(m);
      movementsByIngredient.set(m.ingredientId, list);
    }

    const reportRows = ingredients.map((ing) => {
      const movements = movementsByIngredient.get(ing.id) ?? [];

      let opening = 0;
      let receipts = 0;
      let consumption = 0;
      let adjustments = 0;

      for (const m of movements) {
        const qty = Number(m.quantity);
        const isInitialBaseline =
          Boolean(m.reason?.includes('Initial Opening Balance')) ||
          Boolean(m.reason?.includes('Số dư ban đầu'));

        if (m.createdAt < dayStart || isInitialBaseline) {
          // Trước ngày báo cáo hoặc là số dư ban đầu khi thiết lập hệ thống
          if (m.type === MovementType.STOCK_IN) opening += qty;
          else if (m.type === MovementType.CONSUMPTION) opening -= qty;
          else if (m.type === MovementType.ADJUSTMENT) opening += qty; // delta
        } else {
          // Trong ngày báo cáo
          if (m.type === MovementType.STOCK_IN) receipts += qty;
          else if (m.type === MovementType.CONSUMPTION) consumption += qty;
          else if (m.type === MovementType.ADJUSTMENT) adjustments += qty;
        }
      }

      const closing = Number((opening + receipts - consumption + adjustments).toFixed(2));
      const currentReserved = Number(ing.reservedQty);
      const currentAvailable = Math.max(
        0,
        Number((Number(ing.stock) - Number(ing.reservedQty)).toFixed(2)),
      );

      return {
        ingredientId: ing.id,
        ingredientName: ing.name,
        unit: ing.unit,
        openingBalance: Number(opening.toFixed(2)),
        receipts: Number(receipts.toFixed(2)),
        consumption: Number(consumption.toFixed(2)),
        adjustments: Number(adjustments.toFixed(2)),
        closingBalance: closing,
        currentPhysicalStock: Number(ing.stock),
        currentReserved,
        currentAvailable,
        isReconciled: true,
      };
    });

    return {
      date: reportDateStr,
      timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
      generatedAt: new Date().toISOString(),
      rows: reportRows,
    };
  }
}
