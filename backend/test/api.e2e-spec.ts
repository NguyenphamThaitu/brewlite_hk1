
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('API Testing (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  let email: string;
  let token: string;
  let userId: number;
  let productId: number;

  const createdOrderIds: number[] = [];
  const idPrefix = `api-test-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get(PrismaService);
    email = `${idPrefix}@test.com`;

    // Tao tai khoan test
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'Test123456',
      });

    token = registerResponse.body.accessToken;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !token) {
      throw new Error('Khong the tao tai khoan test');
    }

    userId = user.id;

    // Tao san pham test rieng
    const product = await prisma.product.create({
      data: {
        name: `${idPrefix}-product`,
        price: 30000,
        imageUrl: 'test-image.png',
        stock: 100,
      },
    });

    productId = product.id;
  });

  afterAll(async () => {
    // Don dep du lieu test theo thu tu quan he
    const orders = await prisma.order.findMany({
      where: { userId },
      select: { id: true },
    });

    const orderIds = orders.map((order) => order.id);

    if (orderIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { orderId: { in: orderIds } },
      });

      await prisma.orderItem.deleteMany({
        where: { orderId: { in: orderIds } },
      });

      await prisma.order.deleteMany({
        where: { id: { in: orderIds } },
      });
    }

    if (productId) {
      await prisma.product.deleteMany({
        where: { id: productId },
      });
    }

    if (userId) {
      await prisma.user.deleteMany({
        where: { id: userId },
      });
    }

    await app.close();
  });

  // =========================
  // PRODUCTS API
  // =========================
  describe('Products API', () => {
    it('GET /products - Lay danh sach san pham', async () => {
      const response = await request(app.getHttpServer())
        .get('/products')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(
        response.body.some((product: any) => product.id === productId),
      ).toBe(true);
    });

    it('GET /products/:id - Lay chi tiet san pham', async () => {
      const response = await request(app.getHttpServer())
        .get(`/products/${productId}`)
        .expect(200);

      expect(response.body.id).toBe(productId);
      expect(response.body.price).toBe(30000);
    });

    it('GET /products/:id - San pham khong ton tai', async () => {
      await request(app.getHttpServer())
        .get('/products/999999999')
        .expect(404);
    });

    it('GET /products/:id - ID khong hop le', async () => {
      await request(app.getHttpServer())
        .get('/products/abc')
        .expect(400);
    });
  });

  // =========================
  // AUTH API
  // =========================
  describe('Auth API', () => {
    it('POST /auth/register - Email da ton tai', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email,
          password: 'Test123456',
        })
        .expect(409);
    });

    it('POST /auth/register - Email khong hop le', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Test123456',
        })
        .expect(400);
    });

    it('POST /auth/register - Mat khau qua ngan', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: `${idPrefix}-short@test.com`,
          password: '123',
        })
        .expect(400);
    });

    it('POST /auth/login - Dang nhap thanh cong', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'Test123456',
        })
        .expect(201);

      expect(response.body.accessToken).toBeDefined();
    });

    it('POST /auth/login - Sai mat khau', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email,
          password: 'WrongPassword123',
        })
        .expect(401);
    });
  });

  // =========================
  // ORDERS API
  // =========================
  describe('Orders API', () => {
    it('POST /orders - Khong co token', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .send({ items: [] })
        .expect(401);
    });

    it('POST /orders - Gio hang rong', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({ items: [] })
        .expect(400);
    });

    it('POST /orders - San pham khong ton tai', async () => {
      await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            {
              productId: 999999999,
              size: 'S',
              toppings: [],
              qty: 1,
            },
          ],
        })
        .expect(404);
    });

    it('POST /orders - Tao don hang thanh cong', async () => {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            {
              productId,
              size: 'S',
              toppings: ['Kem'],
              qty: 1,
            },
          ],
        })
        .expect(201);

      expect(response.body.id).toBeDefined();
      expect(response.body.status).toBe('PENDING');
      expect(response.body.total).toBe(35000);

      createdOrderIds.push(response.body.id);
    });

    it('GET /orders/me - Xem don hang cua toi', async () => {
      const response = await request(app.getHttpServer())
        .get('/orders/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(
        response.body.some((order: any) =>
          createdOrderIds.includes(order.id),
        ),
      ).toBe(true);
    });
  });

  // =========================
  // PAYMENTS API
  // =========================
  describe('Payments API', () => {
    let paidOrderId: number;
    let retryOrderId: number;
    let anotherOrderId: number;

    async function createOrder(): Promise<number> {
      const response = await request(app.getHttpServer())
        .post('/orders')
        .set('Authorization', `Bearer ${token}`)
        .send({
          items: [
            {
              productId,
              size: 'S',
              toppings: [],
              qty: 1,
            },
          ],
        })
        .expect(201);

      createdOrderIds.push(response.body.id);
      return response.body.id;
    }

    it('POST /payments - Tao don de thanh toan', async () => {
      paidOrderId = await createOrder();
      retryOrderId = await createOrder();
      anotherOrderId = await createOrder();
    });

    it('POST /payments - Thieu Idempotency-Key', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .send({
          orderId: paidOrderId,
          method: 'WALLET',
        })
        .expect(400);
    });

    it('POST /payments - Thanh toan thanh cong', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', `${idPrefix}-success`)
        .send({
          orderId: paidOrderId,
          method: 'WALLET',
        })
        .expect(201);

      const order = await prisma.order.findUnique({
        where: { id: paidOrderId },
      });

      expect(order?.status).toBe('PAID');
    });

    it('POST /payments - Gui lai cung Idempotency-Key', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', `${idPrefix}-success`)
        .send({
          orderId: paidOrderId,
          method: 'WALLET',
        })
        .expect(201);

      const payments = await prisma.payment.findMany({
        where: { idempotencyKey: `${idPrefix}-success` },
      });

      expect(payments).toHaveLength(1);
    });

    it('POST /payments - Cung key nhung khac don hang', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', `${idPrefix}-success`)
        .send({
          orderId: anotherOrderId,
          method: 'WALLET',
        })
        .expect(409);
    });

    it('POST /payments - Thanh toan that bai', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', `${idPrefix}-failed`)
        .send({
          orderId: retryOrderId,
          method: 'WALLET',
          simulateFail: true,
        })
        .expect(201);

      const order = await prisma.order.findUnique({
        where: { id: retryOrderId },
      });

      expect(order?.status).toBe('PAYMENT_FAILED');
    });

    it('POST /payments - Thanh toan lai sau khi that bai', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', `${idPrefix}-retry`)
        .send({
          orderId: retryOrderId,
          method: 'WALLET',
          simulateFail: false,
        })
        .expect(201);

      const order = await prisma.order.findUnique({
        where: { id: retryOrderId },
      });

      expect(order?.status).toBe('PAID');
    });

    it('POST /payments - Khong the thanh toan don da PAID bang key moi', async () => {
      await request(app.getHttpServer())
        .post('/payments')
        .set('Authorization', `Bearer ${token}`)
        .set('Idempotency-Key', `${idPrefix}-already-paid`)
        .send({
          orderId: paidOrderId,
          method: 'WALLET',
        })
        .expect(400);
    });
  });
});
