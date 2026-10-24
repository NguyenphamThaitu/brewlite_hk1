import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Payment, PaymentStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { assertTransition } from '../orders/order-state';
import { MockGateway } from './mock-gateway';
import { PayDto } from './pay.dto';

type PaymentWithOrder = Payment & { order: { status: OrderStatus } };

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private gateway: MockGateway,
  ) {}

  private toResult(p: PaymentWithOrder) {
    return {
      orderId: p.orderId,
      orderStatus: p.order.status,
      paymentStatus: p.status,
    };
  }

  async pay(userId: number, key: string, dto: PayDto) {
    // 1) Cùng Idempotency-Key: trả lại kết quả cũ, KHÔNG xử lý lại
    const existing = await this.prisma.payment.findUnique({
      where: { idempotencyKey: key },
      include: { order: true },
    });
    if (existing) {
      if (existing.orderId !== dto.orderId)
        throw new ConflictException('Idempotency-Key này đã dùng cho đơn khác');
      return this.toResult(existing);
    }

    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // 2) State machine: PAYMENT_FAILED -> PENDING là "thử lại"
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
    assertTransition(from, target); // đơn đã PAID mà trả lại => 400

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
        // chỉ cập nhật nếu trạng thái chưa bị yêu cầu khác đổi
        const upd = await tx.order.updateMany({
          where: { id: order.id, status: order.status },
          data: { status: target },
        });
        if (upd.count === 0)
          throw new ConflictException('Đơn đã được xử lý bởi yêu cầu khác');
        if (ok) {
          // Điểm thưởng [Giả định]: 1 điểm / 10.000đ, cộng 1 lần khi PAID
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
      // ta trả kết quả của request đầu
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        const p = await this.prisma.payment.findUnique({
          where: { idempotencyKey: key },
          include: { order: true },
        });
        if (p) return this.toResult(p);
      }
      throw e;
    }
  }
}
