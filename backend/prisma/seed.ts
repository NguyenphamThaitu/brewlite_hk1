import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const WEB = process.env.WEB_URL ?? 'http://localhost:3000';

const PRODUCTS = [
  { name: 'Cà phê sữa', price: 35000, imageUrl: `${WEB}/menu/cafesua.jpg` },
  { name: 'Americano', price: 40000, imageUrl: `${WEB}/menu/amricano.jpg` },
  { name: 'Cappuccino', price: 45000, imageUrl: `${WEB}/menu/capu.jpg` },
  { name: 'Trà đào', price: 39000, imageUrl: `${WEB}/menu/tradao.jpg` },
];

async function main() {
  if ((await prisma.product.count()) === 0) {
    await prisma.product.createMany({ data: PRODUCTS });
  } else {
    // cập nhật ảnh cho các món đã có
    for (const p of PRODUCTS) {
      await prisma.product.updateMany({
        where: { name: p.name },
        data: { imageUrl: p.imageUrl },
      });
    }
  }
  await prisma.promotion.upsert({
    where: { code: 'BREW10' },
    update: {},
    create: { code: 'BREW10', percent: 10 },
  });
}

main().finally(() => prisma.$disconnect());
