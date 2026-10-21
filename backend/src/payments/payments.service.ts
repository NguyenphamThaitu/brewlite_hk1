import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { MockGateway } from './mock-gateway';
import { PayDto } from './pay.dto';

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
    if (
      order.status !== OrderStatus.PENDING &&
      order.status !== OrderStatus.PAYMENT_FAILED
    )
      throw new BadRequestException('Đơn không ở trạng thái có thể thanh toán');

    const { ok } = await this.gateway.charge(
      order.total,
      dto.method,
      dto.simulateFail,
    );
    const status = ok ? OrderStatus.PAID : OrderStatus.PAYMENT_FAILED;

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
