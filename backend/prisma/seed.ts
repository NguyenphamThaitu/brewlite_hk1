import { PrismaClient, Role, MovementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const WEB = process.env.WEB_URL ?? 'http://localhost:3000';

const PRODUCTS = [
  { name: 'Cà phê sữa', price: 35000, imageUrl: `${WEB}/menu/cafesua.jpg` },
  { name: 'Americano', price: 40000, imageUrl: `${WEB}/menu/amricano.jpg` },
  { name: 'Cappuccino', price: 45000, imageUrl: `${WEB}/menu/capu.jpg` },
  { name: 'Trà đào', price: 39000, imageUrl: `${WEB}/menu/tradao.jpg` },
];

interface IngredientSeed {
  name: string;
  unit: string;
  stock: number;
  lowStockThreshold: number;
}

// [Ghi chú demo]: Số lượng định lượng nguyên liệu là giả định phục vụ đồ án công nghệ phần mềm BrewLite,
// không phải công thức pha chế thương mại được xác nhận chuyên môn.
const INGREDIENTS: IngredientSeed[] = [
  { name: 'Cà phê hạt / bột', unit: 'g', stock: 30000, lowStockThreshold: 5000 },
  { name: 'Sữa đặc', unit: 'g', stock: 30000, lowStockThreshold: 5000 },
  { name: 'Sữa tươi thanh trùng', unit: 'ml', stock: 40000, lowStockThreshold: 10000 },
  { name: 'Cốt trà đào', unit: 'g', stock: 15000, lowStockThreshold: 3000 },
  { name: 'Siro đào', unit: 'ml', stock: 25000, lowStockThreshold: 5000 },
  { name: 'Đường nước', unit: 'ml', stock: 30000, lowStockThreshold: 5000 },
  { name: 'Trân châu đen', unit: 'g', stock: 15000, lowStockThreshold: 2000 },
  { name: 'Kem béo', unit: 'ml', stock: 15000, lowStockThreshold: 2000 },
  { name: 'Ly giấy kèm nắp', unit: 'pcs', stock: 2000, lowStockThreshold: 200 },
];

// Định lượng từng size (S/M/L)
const RECIPES: Record<
  string,
  Record<'S' | 'M' | 'L', Array<{ ingredient: string; amount: number }>>
> = {
  'Cà phê sữa': {
    S: [
      { ingredient: 'Cà phê hạt / bột', amount: 20 },
      { ingredient: 'Sữa đặc', amount: 30 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
    M: [
      { ingredient: 'Cà phê hạt / bột', amount: 25 },
      { ingredient: 'Sữa đặc', amount: 40 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
    L: [
      { ingredient: 'Cà phê hạt / bột', amount: 30 },
      { ingredient: 'Sữa đặc', amount: 50 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
  },
  Americano: {
    S: [
      { ingredient: 'Cà phê hạt / bột', amount: 18 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
    M: [
      { ingredient: 'Cà phê hạt / bột', amount: 22 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
    L: [
      { ingredient: 'Cà phê hạt / bột', amount: 28 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
  },
  Cappuccino: {
    S: [
      { ingredient: 'Cà phê hạt / bột', amount: 18 },
      { ingredient: 'Sữa tươi thanh trùng', amount: 120 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
    M: [
      { ingredient: 'Cà phê hạt / bột', amount: 22 },
      { ingredient: 'Sữa tươi thanh trùng', amount: 160 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
    L: [
      { ingredient: 'Cà phê hạt / bột', amount: 28 },
      { ingredient: 'Sữa tươi thanh trùng', amount: 220 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
  },
  'Trà đào': {
    S: [
      { ingredient: 'Cốt trà đào', amount: 10 },
      { ingredient: 'Siro đào', amount: 25 },
      { ingredient: 'Đường nước', amount: 15 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
    M: [
      { ingredient: 'Cốt trà đào', amount: 15 },
      { ingredient: 'Siro đào', amount: 35 },
      { ingredient: 'Đường nước', amount: 20 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
    L: [
      { ingredient: 'Cốt trà đào', amount: 20 },
      { ingredient: 'Siro đào', amount: 45 },
      { ingredient: 'Đường nước', amount: 25 },
      { ingredient: 'Ly giấy kèm nắp', amount: 1 },
    ],
  },
};

const TOPPING_RECIPES: Record<string, Array<{ ingredient: string; amount: number }>> = {
  'Trân châu': [{ ingredient: 'Trân châu đen', amount: 30 }],
  Kem: [{ ingredient: 'Kem béo', amount: 40 }],
};

export async function seedAll(client?: PrismaClient) {
  const db = client || prisma;

  // 1. Sản phẩm menu (idempotent: duy trì chính xác 4 món đồ uống gốc)
  const legitimateNames = PRODUCTS.map((p) => p.name);
  for (const p of PRODUCTS) {
    const existing = await db.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await db.product.create({ data: { ...p, isActive: true } });
    } else {
      await db.product.update({
        where: { id: existing.id },
        data: { imageUrl: p.imageUrl, price: p.price, isActive: true },
      });
    }
  }

  // Dọn dẹp an toàn các sản phẩm không thuộc 4 món đồ uống gốc:
  const otherProducts = await db.product.findMany({
    where: { name: { notIn: legitimateNames } },
  });
  for (const extra of otherProducts) {
    const orderCount = await db.orderItem.count({ where: { productId: extra.id } });
    if (orderCount === 0) {
      await db.recipeItem.deleteMany({ where: { productId: extra.id } });
      await db.product.delete({ where: { id: extra.id } });
    } else if (extra.isActive) {
      await db.product.update({
        where: { id: extra.id },
        data: { isActive: false },
      });
    }
  }

  // 2. Khuyến mãi mẫu
  await db.promotion.upsert({
    where: { code: 'BREW10' },
    update: {},
    create: { code: 'BREW10', percent: 10 },
  });

  // 3. Khởi tạo tài khoản quản trị (Admin demo)
  const adminEmail = 'admin@brewlite.vn';
  const existingAdmin = await db.user.findUnique({ where: { email: adminEmail } });
  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('admin123', 10);
    await db.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: Role.ADMIN,
      },
    });
  }

  // 4. Khởi tạo Nguyên liệu & Tồn kho ban đầu (idempotent: không reset tồn kho nếu đã có)
  const legitimateIngredientNames = INGREDIENTS.map((i) => i.name);
  const ingredientMap = new Map<string, number>();

  for (const ing of INGREDIENTS) {
    const existing = await db.ingredient.findUnique({
      where: { name: ing.name },
    });
    if (!existing) {
      const created = await db.ingredient.create({
        data: {
          name: ing.name,
          unit: ing.unit,
          stock: ing.stock,
          reservedQty: 0,
          lowStockThreshold: ing.lowStockThreshold,
        },
      });
      ingredientMap.set(created.name, created.id);
      // Ghi nhận biến động tồn kho mở đầu (Opening stock movement)
      await db.inventoryMovement.create({
        data: {
          ingredientId: created.id,
          type: MovementType.STOCK_IN,
          quantity: ing.stock,
          balanceAfter: ing.stock,
          reason: 'Số dư ban đầu khi thiết lập hệ thống (Initial Opening Balance)',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
        },
      });
    } else {
      ingredientMap.set(existing.name, existing.id);
    }
  }

  // Dọn dẹp an toàn các nguyên liệu không thuộc 9 nguyên liệu gốc (chỉ khi không có liên kết hợp lệ)
  const extraIngredients = await db.ingredient.findMany({
    where: { name: { notIn: legitimateIngredientNames } },
  });
  for (const extra of extraIngredients) {
    const legitRecipeCount = await db.recipeItem.count({
      where: { ingredientId: extra.id, product: { name: { in: legitimateNames } } },
    });
    const legitToppingCount = await db.toppingRecipe.count({
      where: { ingredientId: extra.id },
    });
    if (legitRecipeCount === 0 && legitToppingCount === 0) {
      await db.orderIngredientReservation.deleteMany({ where: { ingredientId: extra.id } });
      await db.recipeItem.deleteMany({ where: { ingredientId: extra.id } });
      await db.inventoryMovement.deleteMany({ where: { ingredientId: extra.id } });
      await db.ingredient.delete({ where: { id: extra.id } });
    }
  }

  // 5. Khởi tạo công thức món (Recipe items cho 4 thức uống gốc)
  const activeProducts = await db.product.findMany({
    where: { name: { in: legitimateNames } },
  });
  for (const prod of activeProducts) {
    const recipeBySizes = RECIPES[prod.name];
    if (!recipeBySizes) continue;

    for (const size of ['S', 'M', 'L'] as const) {
      const items = recipeBySizes[size];
      for (const item of items) {
        const ingId = ingredientMap.get(item.ingredient);
        if (!ingId) continue;

        await db.recipeItem.upsert({
          where: {
            productId_size_ingredientId: {
              productId: prod.id,
              size,
              ingredientId: ingId,
            },
          },
          update: {}, // Không tự ý ghi đè công thức đã tùy chỉnh
          create: {
            productId: prod.id,
            size,
            ingredientId: ingId,
            amount: item.amount,
          },
        });
      }
    }
  }

  // 6. Khởi tạo công thức Topping
  for (const [toppingName, reqs] of Object.entries(TOPPING_RECIPES)) {
    for (const req of reqs) {
      const ingId = ingredientMap.get(req.ingredient);
      if (!ingId) continue;

      await db.toppingRecipe.upsert({
        where: {
          toppingName_ingredientId: {
            toppingName,
            ingredientId: ingId,
          },
        },
        update: {},
        create: {
          toppingName,
          ingredientId: ingId,
          amount: req.amount,
        },
      });
    }
  }
}

async function main() {
  await seedAll();
}

if (require.main === module) {
  main()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}

