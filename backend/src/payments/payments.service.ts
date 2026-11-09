import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Payment, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertTransition } from '../orders/order-state';
import { MockGateway } from './mock-gateway';
import { PayDto } from './pay.dto';
import { InventoryService } from '../inventory/inventory.service';

type PaymentWithOrder = Payment & { order: { status: OrderStatus; userId: number } };

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private gateway: MockGateway,
    private inventoryService: InventoryService,
  ) {}

  private toResult(p: PaymentWithOrder) {
    return {
      orderId: p.orderId,
      orderStatus: p.order.status,
      paymentStatus: p.status,
    };
  }

  async pay(userId: number, key: string, dto: PayDto) {
    // 1) Cùng Idempotency-Key: kiểm tra quyền sở hữu đơn và trả lại kết quả cũ, KHÔNG xử lý lại
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: key },
      include: { order: true },
    });
    if (existing) {
      if (existing.order.userId !== userId) {
        throw new ForbiddenException('Bạn không có quyền truy cập kết quả thanh toán này');
      }
      if (existing.orderId !== dto.orderId) {
        throw new ConflictException('Idempotency-Key này đã dùng cho đơn khác');
      }
      return this.toResult(existing);
    }

    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: { reservations: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán đơn hàng này');
    }

    // Kiểm tra đơn đã bị hủy
    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException('Đơn hàng đã bị hủy, không thể thực hiện thanh toán');
    }

    // Kiểm tra đơn đã thanh toán thành công từ trước
    if (order.status === OrderStatus.PAID) {
      throw new BadRequestException('Đơn hàng đã được thanh toán thành công');
    }

    // Kiểm tra thời hạn giữ chỗ nguyên liệu (10 phút)
    if (order.reservationExpiresAt && order.reservationExpiresAt < new Date()) {
      await this.inventoryService.expireOrderReservation(order.id);
      throw new BadRequestException(
        'Đơn hàng đã hết hạn giữ chỗ (10 phút) và đã tự động bị hủy. Vui lòng tạo đơn mới.',
      );
    }

    // 2) State machine: PAYMENT_FAILED -> PENDING là "thử lại thanh toán"
    let from = order.status;
    if (from === OrderStatus.PAYMENT_FAILED) {
      assertTransition(from, OrderStatus.PENDING);
      from = OrderStatus.PENDING;
    }

    const { ok } = await this.gateway.charge(
      order.total,
      dto.method,
      dto.simulateFail,
    );
    const target = ok ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED;
    assertTransition(from, target);

    try {
      return await this.prisma.$transaction(async (tx) => {
        const payment = await tx.payment.create({
          data: {
            orderId: order.id,
            idempotencyKey: key,
            amount: order.total,
            method: dto.method,
            status: ok ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          },
        });

        // Chỉ cập nhật nếu trạng thái chưa bị yêu cầu khác đổi
        const upd = await tx.order.updateMany({
          where: { id: order.id, status: order.status },
          data: { status: target },
        });
        if (upd.count === 0) {
          throw new ConflictException('Đơn đã được xử lý bởi yêu cầu khác');
        }

        if (ok) {
          // Tiêu hao nguyên liệu đã giữ chỗ chính xác 1 lần
          await this.inventoryService.consumeOrderReservationsTx(tx, order.id);

          // Cập nhật lượt dùng khuyến mãi nếu đơn có dùng mã
          if (order.promoCode) {
            await tx.promotion.updateMany({
              where: { code: order.promoCode },
              data: { usedCount: { increment: 1 } },
            });
          }

          // Điểm thưởng: 1 điểm / 10.000đ, cộng 1 lần khi thanh toán thành công
          await tx.user.update({
            where: { id: userId },
            data: {
              loyaltyPoints: { increment: Math.floor(order.total / 10000) },
            },
          });
        }

        return {
          orderId: order.id,
          orderStatus: target,
          paymentStatus: payment.status,
        };
      });
    } catch (e) {
      // 2 request cùng key chạy song song: request chậm vi phạm unique,
      // ta kiểm tra quyền sở hữu và trả kết quả của request đầu
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const p = await this.prisma.payment.findUnique({
          where: { idempotencyKey: key },
          include: { order: true },
        });
        if (p) {
          if (p.order.userId !== userId) {
            throw new ForbiddenException('Bạn không có quyền truy cập kết quả thanh toán này');
          }
          return this.toResult(p);
        }
      }
      throw e;
    }
  }
}
