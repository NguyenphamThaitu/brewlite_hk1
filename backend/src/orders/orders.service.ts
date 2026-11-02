import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  MovementType,
  OrderStatus,
  Prisma,
  ReservationStatus,
  Role,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { unitPrice } from '../common/pricing';
import { CreateOrderDto } from './create-order.dto';
import { assertTransition } from './order-state';
import { InventoryCalculationService } from '../inventory/inventory-calculation.service';

const RESERVATION_MINUTES = 10; // Thời gian giữ chỗ mặc định: 10 phút

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private calculationService: InventoryCalculationService,
  ) {}

  async create(userId: number, dto: CreateOrderDto) {
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const lines = dto.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p) {
        throw new NotFoundException(`Sản phẩm ${i.productId} không tồn tại`);
      }
      const toppings = i.toppings ?? [];
      const lineTotal = unitPrice(p.price, i.size, toppings) * i.qty;
      subtotal += lineTotal;
      return { productId: p.id, size: i.size, toppings, qty: i.qty, lineTotal };
    });

    // Khuyến mãi
    let discount = 0;
    let promoCode: string | undefined;
    if (dto.promoCode) {
      const promo = await this.prisma.promotion.findUnique({
        where: { code: dto.promoCode.toUpperCase() },
      });
      if (!promo || !promo.active) {
        throw new BadRequestException('Mã khuyến mãi không hợp lệ');
      }
      discount = Math.floor((subtotal * promo.percent) / 100);
      promoCode = promo.code;
    }
    const total = subtotal - discount;

    // 1. Tính toán tổng định lượng nguyên liệu cần giữ chỗ từ toàn bộ giỏ hàng
    const aggregatedReq = await this.calculationService.aggregateRequirements(dto.items);

    // 2. Thực hiện transaction đặt đơn và giữ chỗ nguyên liệu với khóa chống deadlock và chống overselling
    return this.prisma.$transaction(async (tx) => {
      // Sắp xếp ID nguyên liệu tăng dần để tránh deadlock giữa các giao dịch đồng thời
      const sortedIngredientIds = Array.from(aggregatedReq.keys()).sort((a, b) => a - b);

      if (sortedIngredientIds.length > 0) {
        // Khóa các dòng nguyên liệu bằng SELECT ... FOR UPDATE theo thứ tự id tăng dần
        const lockedRows: Array<{
          id: number;
          name: string;
          unit: string;
          stock: Prisma.Decimal;
          reservedQty: Prisma.Decimal;
        }> = await tx.$queryRaw`
          SELECT id, name, unit, stock, "reservedQty"
          FROM "Ingredient"
          WHERE id = ANY(${sortedIngredientIds}::int[])
          ORDER BY id ASC
          FOR UPDATE
        `;

        const rowMap = new Map(lockedRows.map((r) => [r.id, r]));

        // Kiểm tra tính khả dụng: Tồn thực tế - Giữ chỗ >= Cần dùng
        for (const [ingredientId, requiredAmount] of aggregatedReq.entries()) {
          const row = rowMap.get(ingredientId);
          if (!row) {
            throw new BadRequestException(`Không tìm thấy nguyên liệu ID ${ingredientId}`);
          }
          const available = Number(row.stock) - Number(row.reservedQty);
          if (available < requiredAmount) {
            throw new ConflictException(
              `Nguyên liệu "${row.name}" không đủ (còn ${available} ${row.unit}, cần ${requiredAmount} ${row.unit})`,
            );
          }
        }

        // Cập nhật tăng số lượng giữ chỗ (reservedQty)
        for (const [ingredientId, requiredAmount] of aggregatedReq.entries()) {
          await tx.ingredient.update({
            where: { id: ingredientId },
            data: {
              reservedQty: { increment: requiredAmount },
              version: { increment: 1 },
            },
          });
        }
      }

      // Hạn giữ chỗ: 10 phút tính từ thời điểm tạo đơn
      const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

      // Tạo Order và lưu snapshot giữ chỗ nguyên liệu (OrderIngredientReservation)
      const reservationData = Array.from(aggregatedReq.entries()).map(
        ([ingredientId, amount]) => ({
          ingredientId,
          amount,
          status: ReservationStatus.RESERVED,
        }),
      );

      return tx.order.create({
        data: {
          userId,
          total,
          discount,
          promoCode,
          status: OrderStatus.PENDING,
          reservationExpiresAt: expiresAt,
          items: { create: lines },
          reservations: { create: reservationData },
        },
        include: { items: true, reservations: true },
      });
    });
  }

  /**
   * Hủy đơn hàng hợp lệ và hoàn trả nguyên liệu theo đúng vòng đời
   */
  async cancel(orderId: number, userId: number, userRole: Role = Role.CUSTOMER) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { reservations: true },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    if (userRole !== Role.ADMIN && order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền hủy đơn hàng này');
    }

    if (order.status === OrderStatus.CANCELLED) {
      return { id: order.id, status: OrderStatus.CANCELLED, message: 'Đơn hàng đã được hủy trước đó' };
    }

    // Kiểm tra tính hợp lệ của chuyển đổi trạng thái
    assertTransition(order.status, OrderStatus.CANCELLED);

    // Không cho phép hủy khi đã bắt đầu pha chế (PREPARING trở đi)
    if (
      order.status === OrderStatus.PREPARING ||
      order.status === OrderStatus.READY ||
      order.status === OrderStatus.COMPLETED
    ) {
      throw new BadRequestException('Đơn hàng đã bắt đầu pha chế hoặc hoàn tất, không thể hủy');
    }

    return this.prisma.$transaction(async (tx) => {
      const upd = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: OrderStatus.CANCELLED },
      });
      if (upd.count === 0) {
        throw new ConflictException('Đơn hàng đã được cập nhật bởi yêu cầu khác');
      }

      // 1. Nếu đơn đang PENDING hoặc PAYMENT_FAILED (nguyên liệu mới chỉ RESERVED):
      // Giải phóng reservedQty, chuyển trạng thái reservation thành RELEASED.
      if (
        order.status === OrderStatus.PENDING ||
        order.status === OrderStatus.PAYMENT_FAILED
      ) {
        for (const res of order.reservations) {
          if (res.status === ReservationStatus.RESERVED) {
            await tx.ingredient.update({
              where: { id: res.ingredientId },
              data: {
                reservedQty: { decrement: res.amount },
                version: { increment: 1 },
              },
            });
            await tx.orderIngredientReservation.update({
              where: { id: res.id },
              data: { status: ReservationStatus.RELEASED },
            });
          }
        }
      }

      // 2. Nếu đơn đã PAID (nhưng chưa PREPARING):
      // Nguyên liệu đã bị trừ vào stock thực tế, cần hoàn trả lại stock và ghi nhận biến động nhập hoàn
      if (order.status === OrderStatus.PAID) {
        for (const res of order.reservations) {
          if (res.status === ReservationStatus.CONSUMED) {
            const updated = await tx.ingredient.update({
              where: { id: res.ingredientId },
              data: {
                stock: { increment: res.amount },
                version: { increment: 1 },
              },
            });
            await tx.orderIngredientReservation.update({
              where: { id: res.id },
              data: { status: ReservationStatus.RELEASED },
            });
            await tx.inventoryMovement.create({
              data: {
                ingredientId: res.ingredientId,
                type: MovementType.STOCK_IN,
                quantity: res.amount,
                balanceAfter: updated.stock,
                orderId: order.id,
                reason: `Hoàn trả tồn kho do hủy đơn hàng đã thanh toán #${order.id}`,
              },
            });
          }
        }
      }

      return { id: order.id, status: OrderStatus.CANCELLED };
    });
  }

  /**
   * Đổi trạng thái đơn hàng theo Order State Machine
   */
  async changeStatus(orderId: number, to: OrderStatus) {
    if (to === OrderStatus.CANCELLED) {
      // Dùng logic hủy chuẩn của cancel()
      return this.cancel(orderId, 0, Role.ADMIN);
    }

    const order = await this.prisma.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    assertTransition(order.status, to);

    return this.prisma.$transaction(async (tx) => {
      const r = await tx.order.updateMany({
        where: { id: orderId, status: order.status },
        data: { status: to },
      });
      if (r.count === 0) {
        throw new ConflictException('Đơn vừa được cập nhật bởi yêu cầu khác');
      }
      return { id: orderId, status: to };
    });
  }

  findMine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: { select: { name: true } } } },
      },
    });
  }

  async findOne(orderId: number, userId?: number) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: { select: { name: true } } } },
        reservations: { include: { ingredient: true } },
      },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    if (userId && order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xem đơn hàng này');
    }
    return order;
  }
}
