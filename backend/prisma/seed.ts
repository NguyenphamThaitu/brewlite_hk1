import { PrismaClient, Role, MovementType } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const WEB = process.env.WEB_URL ?? 'http://localhost:3000';

const PRODUCTS = [
  // Cà phê truyền thống
  { name: 'Cà phê sữa', price: 35000, category: 'Cà phê truyền thống', imageUrl: `${WEB}/menu/cafesua.jpg` },
  { name: 'Cà phê đen', price: 30000, category: 'Cà phê truyền thống', imageUrl: `${WEB}/menu/capheden.jpg` },
  { name: 'Bạc xỉu', price: 38000, category: 'Cà phê truyền thống', imageUrl: `${WEB}/menu/bacxiu.jpg` },

  // Cà phê pha máy
  { name: 'Espresso', price: 30000, category: 'Cà phê pha máy', imageUrl: `${WEB}/menu/espresso.jpg` },
  { name: 'Americano', price: 40000, category: 'Cà phê pha máy', imageUrl: `${WEB}/menu/amricano.jpg` },
  { name: 'Cappuccino', price: 45000, category: 'Cà phê pha máy', imageUrl: `${WEB}/menu/capu.jpg` },
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
  { name: 'Kem béo', unit: 'ml', stock: 20000, lowStockThreshold: 3000 },
  { name: 'Đường nước', unit: 'ml', stock: 30000, lowStockThreshold: 5000 },
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
    ],
    M: [
      { ingredient: 'Cà phê hạt / bột', amount: 25 },
      { ingredient: 'Sữa đặc', amount: 40 },
    ],
    L: [
      { ingredient: 'Cà phê hạt / bột', amount: 30 },
      { ingredient: 'Sữa đặc', amount: 50 },
    ],
  },
  'Cà phê đen': {
    S: [
      { ingredient: 'Cà phê hạt / bột', amount: 20 },
      { ingredient: 'Đường nước', amount: 10 },
    ],
    M: [
      { ingredient: 'Cà phê hạt / bột', amount: 25 },
      { ingredient: 'Đường nước', amount: 15 },
    ],
    L: [
      { ingredient: 'Cà phê hạt / bột', amount: 30 },
      { ingredient: 'Đường nước', amount: 20 },
    ],
  },
  'Bạc xỉu': {
    S: [
      { ingredient: 'Cà phê hạt / bột', amount: 15 },
      { ingredient: 'Sữa đặc', amount: 35 },
      { ingredient: 'Sữa tươi thanh trùng', amount: 60 },
      { ingredient: 'Kem béo', amount: 10 },
    ],
    M: [
      { ingredient: 'Cà phê hạt / bột', amount: 20 },
      { ingredient: 'Sữa đặc', amount: 45 },
      { ingredient: 'Sữa tươi thanh trùng', amount: 80 },
      { ingredient: 'Kem béo', amount: 15 },
    ],
    L: [
      { ingredient: 'Cà phê hạt / bột', amount: 25 },
      { ingredient: 'Sữa đặc', amount: 55 },
      { ingredient: 'Sữa tươi thanh trùng', amount: 100 },
      { ingredient: 'Kem béo', amount: 20 },
    ],
  },
  Espresso: {
    S: [
      { ingredient: 'Cà phê hạt / bột', amount: 18 },
    ],
    M: [
      { ingredient: 'Cà phê hạt / bột', amount: 22 },
    ],
    L: [
      { ingredient: 'Cà phê hạt / bột', amount: 28 },
    ],
  },
  Americano: {
    S: [
      { ingredient: 'Cà phê hạt / bột', amount: 18 },
    ],
    M: [
      { ingredient: 'Cà phê hạt / bột', amount: 22 },
    ],
    L: [
      { ingredient: 'Cà phê hạt / bột', amount: 28 },
    ],
  },
  Cappuccino: {
    S: [
      { ingredient: 'Cà phê hạt / bột', amount: 18 },
      { ingredient: 'Sữa tươi thanh trùng', amount: 120 },
    ],
    M: [
      { ingredient: 'Cà phê hạt / bột', amount: 22 },
      { ingredient: 'Sữa tươi thanh trùng', amount: 160 },
    ],
    L: [
      { ingredient: 'Cà phê hạt / bột', amount: 28 },
      { ingredient: 'Sữa tươi thanh trùng', amount: 220 },
    ],
  },
};

const TOPPING_RECIPES: Record<string, Array<{ ingredient: string; amount: number }>> = {
  'Đậm cafe': [{ ingredient: 'Cà phê hạt / bột', amount: 5 }],
};

export async function seedAll(client?: PrismaClient) {
  const db = client || prisma;

  // 1. Sản phẩm menu
  const legitimateNames = PRODUCTS.map((p) => p.name);
  for (const p of PRODUCTS) {
    const existing = await db.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await db.product.create({ data: { ...p, isActive: true } });
    } else {
      await db.product.update({
        where: { id: existing.id },
        data: { imageUrl: p.imageUrl, price: p.price, category: p.category, isActive: true },
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

  // Dọn dẹp an toàn các nguyên liệu không thuộc danh sách nguyên liệu chuẩn
  await db.recipeItem.deleteMany({
    where: { ingredient: { name: { notIn: legitimateIngredientNames } } },
  });
  await db.toppingRecipe.deleteMany({
    where: {
      OR: [
        { ingredient: { name: { notIn: legitimateIngredientNames } } },
        { toppingName: { notIn: Object.keys(TOPPING_RECIPES) } },
      ],
    },
  });

  const extraIngredients = await db.ingredient.findMany({
    where: { name: { notIn: legitimateIngredientNames } },
  });
  for (const extra of extraIngredients) {
    await db.orderIngredientReservation.deleteMany({ where: { ingredientId: extra.id } });
    await db.recipeItem.deleteMany({ where: { ingredientId: extra.id } });
    await db.inventoryMovement.deleteMany({ where: { ingredientId: extra.id } });
    await db.ingredient.delete({ where: { id: extra.id } });
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

