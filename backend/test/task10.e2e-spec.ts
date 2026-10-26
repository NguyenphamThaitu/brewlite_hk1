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

  afterAll(() => app.close());

  it('(c) đặt đồng thời 10 đơn khi tồn kho 5 => đúng 5 đơn thành công', async () => {
    const p = await prisma.product.create({
      data: { name: 'Test', price: 10000, imageUrl: 'x', stock: 5 },
    });
    const results = await Promise.all(
      Array.from({ length: 10 }, () =>
        http()
          .post('/orders')
          .set(auth())
          .send({ items: [{ productId: p.id, size: 'S', qty: 1 }] }),
      ),
    );
    expect(results.filter((r) => r.status === 201)).toHaveLength(5);
    const after = await prisma.product.findUniqueOrThrow({
      where: { id: p.id },
    });
    expect(after.stock).toBe(0);
  });

  it('(b) gửi 2 lần cùng Idempotency-Key => chỉ 1 payment, cộng điểm 1 lần', async () => {
    const p = await prisma.product.create({
      data: { name: 'Test2', price: 20000, imageUrl: 'x', stock: 10 },
    });
    const order = (
      await http()
        .post('/orders')
        .set(auth())
        .send({ items: [{ productId: p.id, size: 'S', qty: 1 }] })
    ).body;
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
