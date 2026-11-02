import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Task 10 (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let userId: number;
  const createdProductIds: number[] = [];
  const createdIngredientIds: number[] = [];
  const createdOrderIds: number[] = [];

  const http = () => request(app.getHttpServer());
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
    const r = await http()
      .post('/auth/register')
      .send({ email: `t${Date.now()}@test.com`, password: '123456' });
    token = r.body.accessToken;
    userId = r.body.user.id;
  });

  afterAll(async () => {
    try {
      if (prisma) {
        // Dọn dẹp test fixtures kể cả khi assertions thất bại theo đúng thứ tự khóa ngoại
        await prisma.payment.deleteMany({
          where: {
            OR: [
              ...(createdOrderIds.length > 0 ? [{ orderId: { in: createdOrderIds } }] : []),
              ...(userId ? [{ order: { userId } }] : []),
            ],
          },
        });
        await prisma.orderIngredientReservation.deleteMany({
          where: {
            OR: [
              ...(createdOrderIds.length > 0 ? [{ orderId: { in: createdOrderIds } }] : []),
              { ingredientId: { in: createdIngredientIds } },
              ...(userId ? [{ order: { userId } }] : []),
            ],
          },
        });
        await prisma.orderItem.deleteMany({
          where: {
            OR: [
              ...(createdOrderIds.length > 0 ? [{ orderId: { in: createdOrderIds } }] : []),
              { productId: { in: createdProductIds } },
              ...(userId ? [{ order: { userId } }] : []),
            ],
          },
        });
        await prisma.order.deleteMany({
          where: {
            OR: [
              ...(createdOrderIds.length > 0 ? [{ id: { in: createdOrderIds } }] : []),
              ...(userId ? [{ userId }] : []),
            ],
          },
        });
        await prisma.recipeItem.deleteMany({
          where: {
            OR: [
              { productId: { in: createdProductIds } },
              { ingredientId: { in: createdIngredientIds } },
            ],
          },
        });
        await prisma.product.deleteMany({
          where: { id: { in: createdProductIds } },
        });
        await prisma.inventoryMovement.deleteMany({
          where: { ingredientId: { in: createdIngredientIds } },
        });
        await prisma.ingredient.deleteMany({
          where: { id: { in: createdIngredientIds } },
        });
        if (userId) {
          await prisma.user.deleteMany({ where: { id: userId } });
        }
      }
    } finally {
      if (app) await app.close();
    }
  });

  it('(c) đặt đồng thời 10 đơn khi tồn kho nguyên liệu 5 => đúng 5 đơn thành công', async () => {
    const ing = await prisma.ingredient.create({
      data: { name: `Task10_Ing_${Date.now()}`, unit: 'pcs', stock: 5, reservedQty: 0 },
    });
    createdIngredientIds.push(ing.id);

    const p = await prisma.product.create({
      data: { name: `Task10_P_${Date.now()}`, price: 10000, imageUrl: 'x', stock: 5 },
    });
    createdProductIds.push(p.id);

    await prisma.recipeItem.create({
      data: { productId: p.id, size: 'S', ingredientId: ing.id, amount: 1 },
    });

    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        http()
          .post('/orders')
          .set(auth())
          .send({ items: [{ productId: p.id, size: 'S', qty: 1 }] }),
      ),
    );
    results.filter((r) => r.status === 201).forEach((r) => createdOrderIds.push(r.body.id));
    expect(results.filter((r) => r.status === 201)).toHaveLength(5);
    const after = await prisma.ingredient.findUniqueOrThrow({
      where: { id: ing.id },
    });
    // Tồn khả dụng = stock - reservedQty = 5 - 5 = 0
    expect(Number(after.stock) - Number(after.reservedQty)).toBe(0);
  });

  it('(b) gửi 2 lần cùng Idempotency-Key => chỉ 1 payment, cộng điểm 1 lần', async () => {
    const ing = await prisma.ingredient.create({
      data: { name: `Task10_Ing2_${Date.now()}`, unit: 'pcs', stock: 10, reservedQty: 0 },
    });
    createdIngredientIds.push(ing.id);

    const p = await prisma.product.create({
      data: { name: `Task10_P2_${Date.now()}`, price: 20000, imageUrl: 'x', stock: 10 },
    });
    createdProductIds.push(p.id);

    await prisma.recipeItem.create({
      data: { productId: p.id, size: 'S', ingredientId: ing.id, amount: 1 },
    });

    const order = (
      await http()
        .post('/orders')
        .set(auth())
        .send({ items: [{ productId: p.id, size: 'S', qty: 1 }] })
    ).body;
    createdOrderIds.push(order.id);
    const key = `key-${Date.now()}`;
    const pay = () =>
      http()
        .post('/payments')
        .set(auth())
        .set('Idempotency-Key', key)
        .send({ orderId: order.id, method: 'WALLET' });

    const [r1, r2] = await Promise.all([pay(), pay()]);
    expect(r1.status).toBeLessThan(300);
    expect(r2.status).toBeLessThan(300);
    expect(r1.body.orderStatus).toBe('PAID');
    expect(r2.body.orderStatus).toBe('PAID');

    expect(await prisma.payment.count({ where: { orderId: order.id } })).toBe(
      1,
    );
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(user.loyaltyPoints).toBe(2); // 20.000đ / 10.000đ
  });

  it('thanh toán lại đơn đã PAID bằng key mới => 400', async () => {
    const o = await prisma.order.findFirstOrThrow({
      where: { userId, status: 'PAID' },
    });
    const r = await http()
      .post('/payments')
      .set(auth())
      .set('Idempotency-Key', `new-${Date.now()}`)
      .send({ orderId: o.id, method: 'CARD' });
    expect(r.status).toBe(400);
  });
});
