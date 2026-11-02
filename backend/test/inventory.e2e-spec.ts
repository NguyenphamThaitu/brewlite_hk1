import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';
import { seedAll } from '../prisma/seed';

describe('Ingredient Inventory System (Comprehensive E2E)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let customerToken: string;
  let customerId: number;
  let adminToken: string;

  const trackedUserIds = new Set<number>();
  const trackedProductIds = new Set<number>();
  const trackedIngredientIds = new Set<number>();
  const trackedOrderIds = new Set<number>();

  const http = () => request(app.getHttpServer());
  const customerAuth = () => ({ Authorization: `Bearer ${customerToken}` });
  const adminAuth = () => ({ Authorization: `Bearer ${adminToken}` });

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

    // Đảm bảo dữ liệu seed đầy đủ trong CSDL kiểm thử
    await seedAll(prisma);

    // 1. Tạo customer
    const custRes = await http()
      .post('/auth/register')
      .send({ email: `customer_${Date.now()}@test.com`, password: 'password123' });
    customerToken = custRes.body.accessToken;
    customerId = custRes.body.user.id;
    trackedUserIds.add(customerId);

    // 2. Lấy hoặc tạo admin
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@brewlite.vn' },
    });
    if (adminUser) {
      const loginRes = await http()
        .post('/auth/login')
        .send({ email: 'admin@brewlite.vn', password: 'admin123' });
      adminToken = loginRes.body.accessToken;
    } else {
      const regAdmin = await http()
        .post('/auth/register')
        .send({ email: `admin_${Date.now()}@test.com`, password: 'admin123' });
      await prisma.user.update({
        where: { id: regAdmin.body.user.id },
        data: { role: Role.ADMIN },
      });
      trackedUserIds.add(regAdmin.body.user.id);
      const loginRes = await http()
        .post('/auth/login')
        .send({ email: regAdmin.body.user.email, password: 'admin123' });
      adminToken = loginRes.body.accessToken;
    }
  });

  afterAll(async () => {
    try {
      if (prisma) {
        const userIds = Array.from(trackedUserIds);
        const orderIds = Array.from(trackedOrderIds);
        const prodIds = Array.from(trackedProductIds);
        const ingIds = Array.from(trackedIngredientIds);

        // 1. Xóa payments
        await prisma.payment.deleteMany({
          where: {
            OR: [
              ...(orderIds.length > 0 ? [{ orderId: { in: orderIds } }] : []),
              ...(userIds.length > 0 ? [{ order: { userId: { in: userIds } } }] : []),
            ],
          },
        });

        // 2. Xóa reservations
        await prisma.orderIngredientReservation.deleteMany({
          where: {
            OR: [
              ...(orderIds.length > 0 ? [{ orderId: { in: orderIds } }] : []),
              ...(ingIds.length > 0 ? [{ ingredientId: { in: ingIds } }] : []),
              ...(userIds.length > 0 ? [{ order: { userId: { in: userIds } } }] : []),
            ],
          },
        });

        // 3. Xóa order items
        await prisma.orderItem.deleteMany({
          where: {
            OR: [
              ...(orderIds.length > 0 ? [{ orderId: { in: orderIds } }] : []),
              ...(prodIds.length > 0 ? [{ productId: { in: prodIds } }] : []),
              ...(userIds.length > 0 ? [{ order: { userId: { in: userIds } } }] : []),
            ],
          },
        });

        // 4. Xóa orders
        await prisma.order.deleteMany({
          where: {
            OR: [
              ...(orderIds.length > 0 ? [{ id: { in: orderIds } }] : []),
              ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
            ],
          },
        });

        // 5. Xóa recipe items
        await prisma.recipeItem.deleteMany({
          where: {
            OR: [
              ...(prodIds.length > 0 ? [{ productId: { in: prodIds } }] : []),
              ...(ingIds.length > 0 ? [{ ingredientId: { in: ingIds } }] : []),
            ],
          },
        });

        // 6. Xóa test products
        if (prodIds.length > 0) {
          await prisma.product.deleteMany({
            where: { id: { in: prodIds } },
          });
        }

        // 7. Xóa test inventory movements
        await prisma.inventoryMovement.deleteMany({
          where: {
            OR: [
              ...(ingIds.length > 0 ? [{ ingredientId: { in: ingIds } }] : []),
              { reason: { contains: 'thử nghiệm' } },
              { reason: { contains: 'rang xay' } },
              { reason: { contains: 'Pha chế đồ uống cho đơn hàng #' } },
            ],
          },
        });

        // 8. Xóa test ingredients
        if (ingIds.length > 0) {
          await prisma.ingredient.deleteMany({
            where: { id: { in: ingIds } },
          });
        }

        // 9. Xóa test users
        if (userIds.length > 0) {
          await prisma.user.deleteMany({
            where: { id: { in: userIds } },
          });
        }

        // 10. Đưa tồn kho của các nguyên liệu gốc trong CSDL test về trạng thái chuẩn ban đầu
        await prisma.ingredient.updateMany({
          where: { name: 'Cà phê hạt / bột' },
          data: { stock: 30000, reservedQty: 0 },
        });
        await prisma.ingredient.updateMany({
          where: { name: 'Sữa đặc' },
          data: { stock: 30000, reservedQty: 0 },
        });
        await prisma.ingredient.updateMany({
          where: { name: 'Ly giấy kèm nắp' },
          data: { stock: 2000, reservedQty: 0 },
        });
      }
    } finally {
      if (app) await app.close();
    }
  });

  describe('1. Phân quyền và Bảo mật (RBAC & Ownership)', () => {
    it('Khách hàng thông thường bị từ chối (403) khi gọi các API quản trị kho', async () => {
      const r1 = await http().get('/inventory/ingredients').set(customerAuth());
      expect(r1.status).toBe(403);

      const r2 = await http().post('/inventory/stock-in').set(customerAuth()).send({
        ingredientId: 1,
        quantity: 100,
      });
      expect(r2.status).toBe(403);

      const r3 = await http().post('/inventory/adjust').set(customerAuth()).send({
        ingredientId: 1,
        actualStock: 100,
        reason: 'test',
      });
      expect(r3.status).toBe(403);

      const r4 = await http().get('/inventory/reports/daily').set(customerAuth());
      expect(r4.status).toBe(403);
    });

    it('Tài khoản Admin truy cập thành công (200) các API quản trị kho', async () => {
      const res = await http().get('/inventory/ingredients').set(adminAuth());
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(9);
    });

    it('Không cho phép người dùng xem kết quả thanh toán của người khác bằng Idempotency-Key', async () => {
      const p = await prisma.product.findFirstOrThrow({ where: { name: 'Cà phê sữa' } });
      const order = (
        await http()
          .post('/orders')
          .set(customerAuth())
          .send({ items: [{ productId: p.id, size: 'S', qty: 1 }] })
      ).body;
      trackedOrderIds.add(order.id);

      const key = `key-ownership-${Date.now()}`;
      await http()
        .post('/payments')
        .set(customerAuth())
        .set('Idempotency-Key', key)
        .send({ orderId: order.id, method: 'WALLET' });

      // Tạo user thứ 2
      const user2Res = await http()
        .post('/auth/register')
        .send({ email: `user2_${Date.now()}@test.com`, password: 'password123' });
      trackedUserIds.add(user2Res.body.user.id);
      const user2Token = user2Res.body.accessToken;

      // User 2 gọi thanh toán với cùng key của User 1 => 403 Forbidden
      const hackRes = await http()
        .post('/payments')
        .set({ Authorization: `Bearer ${user2Token}` })
        .set('Idempotency-Key', key)
        .send({ orderId: order.id, method: 'WALLET' });
      expect(hackRes.status).toBe(403);
    });
  });

  describe('2. Dự báo cơ cấu bán hàng (Sales Mix Forecast)', () => {
    it('Tính toán chính xác tổng định lượng cho 500 ly Cà phê sữa M và 500 ly Trà đào M', async () => {
      const cfSua = await prisma.product.findFirstOrThrow({ where: { name: 'Cà phê sữa' } });
      const traDao = await prisma.product.findFirstOrThrow({ where: { name: 'Trà đào' } });

      const res = await http()
        .post('/inventory/forecast')
        .set(adminAuth())
        .send({
          items: [
            { productId: cfSua.id, size: 'M', qty: 500 },
            { productId: traDao.id, size: 'M', qty: 500 },
          ],
        });

      expect(res.status).toBe(201);
      const { ingredients, canFulfillAll } = res.body;

      const byName = new Map<string, any>(ingredients.map((i: any) => [i.ingredientName, i]));

      // 500 ly Cà phê sữa M: Cà phê (500*25=12,500g), Sữa đặc (500*40=20,000g), Ly giấy (500*1=500)
      // 500 ly Trà đào M: Cốt trà (500*15=7,500g), Siro đào (500*35=17,500ml), Đường nước (500*20=10,000ml), Ly giấy (500*1=500)
      // Tổng Ly giấy (dùng chung): 500 + 500 = 1,000 pcs
      expect(byName.get('Cà phê hạt / bột')?.required).toBe(12500);
      expect(byName.get('Sữa đặc')?.required).toBe(20000);
      expect(byName.get('Cốt trà đào')?.required).toBe(7500);
      expect(byName.get('Siro đào')?.required).toBe(17500);
      expect(byName.get('Đường nước')?.required).toBe(10000);
      expect(byName.get('Ly giấy kèm nắp')?.required).toBe(1000);

      expect(typeof canFulfillAll).toBe('boolean');
    });

    it('Dự báo KHÔNG làm thay đổi tồn kho thực tế, không tạo giữ chỗ hay đơn hàng', async () => {
      const ingBefore = await prisma.ingredient.findMany();
      const countOrdersBefore = await prisma.order.count();
      const countMovementsBefore = await prisma.inventoryMovement.count();

      const p = await prisma.product.findFirstOrThrow({ where: { name: 'Americano' } });
      await http()
        .post('/inventory/forecast')
        .set(adminAuth())
        .send({
          items: [{ productId: p.id, size: 'L', qty: 600 }],
        });

      const ingAfter = await prisma.ingredient.findMany();
      const countOrdersAfter = await prisma.order.count();
      const countMovementsAfter = await prisma.inventoryMovement.count();

      expect(countOrdersAfter).toBe(countOrdersBefore);
      expect(countMovementsAfter).toBe(countMovementsBefore);
      for (let i = 0; i < ingBefore.length; i++) {
        expect(Number(ingAfter[i].stock)).toBe(Number(ingBefore[i].stock));
        expect(Number(ingAfter[i].reservedQty)).toBe(Number(ingBefore[i].reservedQty));
      }
    });

    it('Tính đúng định lượng khi có topping và khác biệt size S/M/L', async () => {
      const cfSua = await prisma.product.findFirstOrThrow({ where: { name: 'Cà phê sữa' } });
      // 1 ly Cà phê sữa S + Trân châu (30g) + Kem (40ml)
      // Cà phê sữa S: Cà phê (20g), Sữa đặc (30g), Ly giấy (1)
      const res = await http()
        .post('/inventory/forecast')
        .set(adminAuth())
        .send({
          items: [
            {
              productId: cfSua.id,
              size: 'S',
              toppings: ['Trân châu', 'Kem'],
              qty: 1,
            },
          ],
        });

      expect(res.status).toBe(201);
      const byName = new Map<string, any>(res.body.ingredients.map((i: any) => [i.ingredientName, i]));
      expect(byName.get('Cà phê hạt / bột')?.required).toBe(20);
      expect(byName.get('Sữa đặc')?.required).toBe(30);
      expect(byName.get('Trân châu đen')?.required).toBe(30);
      expect(byName.get('Kem béo')?.required).toBe(40);
      expect(byName.get('Ly giấy kèm nắp')?.required).toBe(1);
    });

    it('Từ chối tính toán nếu biến thể đồ uống chưa cấu hình công thức', async () => {
      const dummyProd = await prisma.product.create({
        data: { name: 'Chưa có công thức', price: 20000, imageUrl: 'x', stock: 100 },
      });
      trackedProductIds.add(dummyProd.id);

      const res = await http()
        .post('/inventory/forecast')
        .set(adminAuth())
        .send({
          items: [{ productId: dummyProd.id, size: 'M', qty: 1 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Chưa cấu hình công thức');
    });
  });

  describe('3. Đặt hàng, Giữ chỗ và Kiểm soát tồn kho đồng thời (Concurrency & Atomicity)', () => {
    it('Đúng tồn kho khả dụng thì thành công, thiếu nguyên liệu thì từ chối (409 Conflict)', async () => {
      // Tạo nguyên liệu test riêng biệt để kiểm tra chính xác
      const testIng = await prisma.ingredient.create({
        data: { name: `TestIng_${Date.now()}`, unit: 'g', stock: 100, reservedQty: 0 },
      });
      trackedIngredientIds.add(testIng.id);
      const testProd = await prisma.product.create({
        data: { name: `TestDrink_${Date.now()}`, price: 25000, imageUrl: 'x' },
      });
      trackedProductIds.add(testProd.id);
      await prisma.recipeItem.create({
        data: { productId: testProd.id, size: 'M', ingredientId: testIng.id, amount: 20 },
      });

      // Tồn kho: 100g, mỗi ly cần 20g => tối đa 5 ly
      // 1. Đặt 5 ly => thành công
      const r1 = await http()
        .post('/orders')
        .set(customerAuth())
        .send({ items: [{ productId: testProd.id, size: 'M', qty: 5 }] });
      expect(r1.status).toBe(201);
      trackedOrderIds.add(r1.body.id);

      const afterR1 = await prisma.ingredient.findUniqueOrThrow({ where: { id: testIng.id } });
      expect(Number(afterR1.reservedQty)).toBe(100);

      // 2. Đặt thêm 1 ly nữa => 409 Conflict (hết hàng khả dụng)
      const r2 = await http()
        .post('/orders')
        .set(customerAuth())
        .send({ items: [{ productId: testProd.id, size: 'M', qty: 1 }] });
      expect(r2.status).toBe(409);
      expect(r2.body.message).toContain('không đủ');
    });

    it('Rollback toàn bộ giao dịch khi một trong các nguyên liệu không đủ', async () => {
      const ingAbundant = await prisma.ingredient.create({
        data: { name: `Abundant_${Date.now()}`, unit: 'g', stock: 10000, reservedQty: 0 },
      });
      trackedIngredientIds.add(ingAbundant.id);
      const ingScarce = await prisma.ingredient.create({
        data: { name: `Scarce_${Date.now()}`, unit: 'g', stock: 5, reservedQty: 0 },
      });
      trackedIngredientIds.add(ingScarce.id);
      const testProd = await prisma.product.create({
        data: { name: `ComboDrink_${Date.now()}`, price: 30000, imageUrl: 'x' },
      });
      trackedProductIds.add(testProd.id);
      await prisma.recipeItem.createMany({
        data: [
          { productId: testProd.id, size: 'M', ingredientId: ingAbundant.id, amount: 50 },
          { productId: testProd.id, size: 'M', ingredientId: ingScarce.id, amount: 10 }, // Cần 10g nhưng chỉ có 5g
        ],
      });

      const res = await http()
        .post('/orders')
        .set(customerAuth())
        .send({ items: [{ productId: testProd.id, size: 'M', qty: 1 }] });

      expect(res.status).toBe(409);

      // Kiểm tra Abundant KHÔNG bị giữ chỗ (rollback hoàn toàn)
      const checkAbundant = await prisma.ingredient.findUniqueOrThrow({ where: { id: ingAbundant.id } });
      expect(Number(checkAbundant.reservedQty)).toBe(0);
    });

    it('Đặt đồng thời 10 đơn cho 2 món khác nhau cùng dùng chung nguyên liệu => không oversell', async () => {
      // Tạo nguyên liệu dùng chung với tồn kho chỉ đủ 4 ly
      const sharedIng = await prisma.ingredient.create({
        data: { name: `Shared_${Date.now()}`, unit: 'g', stock: 80, reservedQty: 0 },
      });
      trackedIngredientIds.add(sharedIng.id);
      const drinkA = await prisma.product.create({
        data: { name: `DrinkA_${Date.now()}`, price: 20000, imageUrl: 'x' },
      });
      trackedProductIds.add(drinkA.id);
      const drinkB = await prisma.product.create({
        data: { name: `DrinkB_${Date.now()}`, price: 20000, imageUrl: 'x' },
      });
      trackedProductIds.add(drinkB.id);

      // Mỗi ly của cả DrinkA và DrinkB đều tiêu thụ 20g sharedIng
      await prisma.recipeItem.create({
        data: { productId: drinkA.id, size: 'S', ingredientId: sharedIng.id, amount: 20 },
      });
      await prisma.recipeItem.create({
        data: { productId: drinkB.id, size: 'S', ingredientId: sharedIng.id, amount: 20 },
      });

      // 10 yêu cầu đồng thời (5 DrinkA + 5 DrinkB)
      const requests = [
        ...Array.from({ length: 5 }, () =>
          http()
            .post('/orders')
            .set(customerAuth())
            .send({ items: [{ productId: drinkA.id, size: 'S', qty: 1 }] }),
        ),
        ...Array.from({ length: 5 }, () =>
          http()
            .post('/orders')
            .set(customerAuth())
            .send({ items: [{ productId: drinkB.id, size: 'S', qty: 1 }] }),
        ),
      ];

      const responses = await Promise.all(requests);
      const successful = responses.filter((r) => r.status === 201);
      const rejected = responses.filter((r) => r.status === 409);
      successful.forEach((r) => trackedOrderIds.add(r.body.id));

      // Đúng 4 đơn thành công (4 * 20g = 80g), 6 đơn bị từ chối
      expect(successful).toHaveLength(4);
      expect(rejected).toHaveLength(6);

      const checkShared = await prisma.ingredient.findUniqueOrThrow({ where: { id: sharedIng.id } });
      expect(Number(checkShared.reservedQty)).toBe(80);
      expect(Number(checkShared.stock) - Number(checkShared.reservedQty)).toBe(0);
    });
  });

  describe('4. Vòng đời đơn hàng, Thanh toán và Tiêu hao nguyên liệu (Lifecycle & Idempotency)', () => {
    it('Thanh toán thành công: tiêu hao giữ chỗ đúng 1 lần, trừ tồn thực tế và cộng điểm thưởng', async () => {
      const p = await prisma.product.findFirstOrThrow({ where: { name: 'Americano' } });
      const order = (
        await http()
          .post('/orders')
          .set(customerAuth())
          .send({ items: [{ productId: p.id, size: 'S', qty: 1 }] })
      ).body;
      trackedOrderIds.add(order.id);

      const userBefore = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
      const key = `pay-success-${Date.now()}`;

      const res = await http()
        .post('/payments')
        .set(customerAuth())
        .set('Idempotency-Key', key)
        .send({ orderId: order.id, method: 'WALLET' });

      expect(res.status).toBe(201);
      expect(res.body.orderStatus).toBe('PAID');

      // Điểm thưởng tăng
      const userAfter = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
      expect(userAfter.loyaltyPoints).toBe(
        userBefore.loyaltyPoints + Math.floor(order.total / 10000),
      );

      // Kiểm tra reservation đã CONSUMED
      const reservations = await prisma.orderIngredientReservation.findMany({
        where: { orderId: order.id },
      });
      expect(reservations.every((r) => r.status === 'CONSUMED')).toBe(true);

      // Gửi lại cùng key => trả về kết quả cũ, KHÔNG trừ thêm nguyên liệu, KHÔNG cộng thêm điểm
      const resDup = await http()
        .post('/payments')
        .set(customerAuth())
        .set('Idempotency-Key', key)
        .send({ orderId: order.id, method: 'WALLET' });
      expect(resDup.status).toBe(201);
      expect(resDup.body.orderStatus).toBe('PAID');

      const userDup = await prisma.user.findUniqueOrThrow({ where: { id: customerId } });
      expect(userDup.loyaltyPoints).toBe(userAfter.loyaltyPoints);
    });

    it('Thanh toán thất bại giữ nguyên reservation; thử lại thành công tiêu hao đúng 1 lần', async () => {
      const p = await prisma.product.findFirstOrThrow({ where: { name: 'Americano' } });
      const order = (
        await http()
          .post('/orders')
          .set(customerAuth())
          .send({ items: [{ productId: p.id, size: 'S', qty: 1 }] })
      ).body;
      trackedOrderIds.add(order.id);

      // 1. Thanh toán giả lập lỗi
      const failKey = `pay-fail-${Date.now()}`;
      const failRes = await http()
        .post('/payments')
        .set(customerAuth())
        .set('Idempotency-Key', failKey)
        .send({ orderId: order.id, method: 'CARD', simulateFail: true });

      expect(failRes.status).toBe(201);
      expect(failRes.body.orderStatus).toBe('PAYMENT_FAILED');

      // Reservation vẫn ở trạng thái RESERVED
      const resvAfterFail = await prisma.orderIngredientReservation.findMany({
        where: { orderId: order.id },
      });
      expect(resvAfterFail.every((r) => r.status === 'RESERVED')).toBe(true);

      // 2. Thử lại thanh toán với key mới
      const retryKey = `pay-retry-${Date.now()}`;
      const retryRes = await http()
        .post('/payments')
        .set(customerAuth())
        .set('Idempotency-Key', retryKey)
        .send({ orderId: order.id, method: 'CARD', simulateFail: false });

      expect(retryRes.status).toBe(201);
      expect(retryRes.body.orderStatus).toBe('PAID');

      // Reservation chuyển thành CONSUMED
      const resvAfterRetry = await prisma.orderIngredientReservation.findMany({
        where: { orderId: order.id },
      });
      expect(resvAfterRetry.every((r) => r.status === 'CONSUMED')).toBe(true);
    });

    it('Hủy đơn giải phóng giữ chỗ chính xác 1 lần và không cho phép thanh toán đơn đã hủy', async () => {
      const p = await prisma.product.findFirstOrThrow({ where: { name: 'Americano' } });
      const order = (
        await http()
          .post('/orders')
          .set(customerAuth())
          .send({ items: [{ productId: p.id, size: 'S', qty: 1 }] })
      ).body;
      trackedOrderIds.add(order.id);

      const resvBefore = await prisma.orderIngredientReservation.findFirstOrThrow({
        where: { orderId: order.id },
      });
      const ingBefore = await prisma.ingredient.findUniqueOrThrow({
        where: { id: resvBefore.ingredientId },
      });

      // Hủy đơn
      const cancelRes = await http()
        .post(`/orders/${order.id}/cancel`)
        .set(customerAuth());
      expect(cancelRes.status).toBe(201);
      expect(cancelRes.body.status).toBe('CANCELLED');

      // Reserved quantity được giảm
      const ingAfter = await prisma.ingredient.findUniqueOrThrow({
        where: { id: resvBefore.ingredientId },
      });
      expect(Number(ingAfter.reservedQty)).toBe(
        Number(ingBefore.reservedQty) - Number(resvBefore.amount),
      );

      // Cố tình thanh toán đơn đã hủy => 400 Bad Request
      const payCancelled = await http()
        .post('/payments')
        .set(customerAuth())
        .set('Idempotency-Key', `pay-cancel-${Date.now()}`)
        .send({ orderId: order.id, method: 'WALLET' });
      expect(payCancelled.status).toBe(400);
      expect(payCancelled.body.message).toContain('bị hủy');
    });

    it('Thay đổi công thức sau khi đặt hàng KHÔNG làm thay đổi định lượng giữ chỗ của đơn cũ', async () => {
      const p = await prisma.product.findFirstOrThrow({ where: { name: 'Americano' } });
      const order = (
        await http()
          .post('/orders')
          .set(customerAuth())
          .send({ items: [{ productId: p.id, size: 'S', qty: 1 }] })
      ).body;
      trackedOrderIds.add(order.id);

      const oldSnapshot = await prisma.orderIngredientReservation.findMany({
        where: { orderId: order.id },
      });

      // Admin đổi công thức Americano S
      const coffeeIng = await prisma.ingredient.findFirstOrThrow({
        where: { name: 'Cà phê hạt / bột' },
      });
      await http()
        .put('/inventory/recipes/product')
        .set(adminAuth())
        .send({
          productId: p.id,
          size: 'S',
          ingredients: [{ ingredientId: coffeeIng.id, amount: 99 }],
        });

      // Snapshot của đơn hàng cũ vẫn giữ nguyên định lượng ban đầu
      const currentSnapshot = await prisma.orderIngredientReservation.findMany({
        where: { orderId: order.id },
      });
      expect(Number(currentSnapshot[0].amount)).toBe(Number(oldSnapshot[0].amount));
      expect(Number(currentSnapshot[0].amount)).not.toBe(99);

      // Phục hồi lại công thức chuẩn
      await http()
        .put('/inventory/recipes/product')
        .set(adminAuth())
        .send({
          productId: p.id,
          size: 'S',
          ingredients: [
            { ingredientId: coffeeIng.id, amount: 18 },
            { ingredientId: (await prisma.ingredient.findFirstOrThrow({ where: { name: 'Ly giấy kèm nắp' } })).id, amount: 1 },
          ],
        });
    });
  });

  describe('5. Báo cáo đối soát xuất-nhập-tồn hàng ngày (Daily Reporting)', () => {
    it('Báo cáo cân đối toán học: Tồn cuối = Tồn đầu + Nhập - Xuất + Điều chỉnh', async () => {
      const res = await http().get('/inventory/reports/daily').set(adminAuth());
      expect(res.status).toBe(200);
      expect(res.body.timezone).toContain('Asia/Ho_Chi_Minh');
      expect(Array.isArray(res.body.rows)).toBe(true);

      for (const row of res.body.rows) {
        const calculatedClosing = Number(
          (row.openingBalance + row.receipts - row.consumption + row.adjustments).toFixed(2),
        );
        expect(row.closingBalance).toBe(calculatedClosing);
        expect(row.isReconciled).toBe(true);
      }
    });

    it('Nhập kho và Điều chỉnh kiểm kê được ghi nhận chính xác trong báo cáo', async () => {
      const ing = await prisma.ingredient.findFirstOrThrow({ where: { name: 'Cà phê hạt / bột' } });
      const initialStock = Number(ing.stock);

      // Nhập kho 500g
      await http().post('/inventory/stock-in').set(adminAuth()).send({
        ingredientId: ing.id,
        quantity: 500,
        reason: 'Nhập hạt Arabica thử nghiệm',
      });

      // Điều chỉnh kiểm kê về initialStock + 450g (hao hụt 50g)
      await http().post('/inventory/adjust').set(adminAuth()).send({
        ingredientId: ing.id,
        actualStock: initialStock + 450,
        reason: 'Hao hụt tự nhiên khi rang xay',
      });

      const report = await http().get('/inventory/reports/daily').set(adminAuth());
      const row = report.body.rows.find((r: any) => r.ingredientId === ing.id);
      expect(row.receipts).toBeGreaterThanOrEqual(500);
      expect(row.currentPhysicalStock).toBe(initialStock + 450);
    });
  });
});
