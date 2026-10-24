import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MockGateway } from './mock-gateway';
import { PayDto } from './pay.dto';
import { assertTransition } from '../orders/order-state';
@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private gateway: MockGateway,
  ) {}

  async pay(userId: number, key: string, dto: PayDto) {
    const order = await this.prisma.order.findFirst({
      where: { id: dto.orderId, userId },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    // PAYMENT_FAILED -> PENDING là "thử lại"
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
    const status = ok ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED;
    assertTransition(from, status); // đơn đã PAID mà trả lại => 400

    await this.prisma.$transaction([
      this.prisma.payment.create({
        data: {
          orderId: order.id,
          idempotencyKey: key,
          amount: order.total,
          method: dto.method,
          status: ok ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
        },
      }),
      this.prisma.order.update({ where: { id: order.id }, data: { status } }),
    ]);

    return {
      orderId: order.id,
      orderStatus: status,
      paymentStatus: ok ? 'SUCCESS' : 'FAILED',
    };
  }
}
