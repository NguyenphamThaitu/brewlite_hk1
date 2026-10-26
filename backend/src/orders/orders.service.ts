import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { unitPrice } from '../common/pricing';
import { CreateOrderDto } from './create-order.dto';
import { assertTransition } from './order-state';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto) {
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    const lines = dto.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p)
        throw new NotFoundException(`Sản phẩm ${i.productId} không tồn tại`);
      const toppings = i.toppings ?? [];
      const lineTotal = unitPrice(p.price, i.size, toppings) * i.qty;
      subtotal += lineTotal;
      return { productId: p.id, size: i.size, toppings, qty: i.qty, lineTotal };
    });

    // Khuyến mãi (10.4)
    let discount = 0;
    let promoCode: string | undefined;
    if (dto.promoCode) {
      const promo = await this.prisma.promotion.findUnique({
        where: { code: dto.promoCode.toUpperCase() },
      });
      if (!promo || !promo.active)
        throw new BadRequestException('Mã khuyến mãi không hợp lệ');
      discount = Math.floor((subtotal * promo.percent) / 100);
      promoCode = promo.code;
    }
    const total = subtotal - discount;

    // Gộp số lượng theo sản phẩm, sắp xếp theo id để tránh deadlock
    const need = new Map<number, number>();
    for (const i of dto.items)
      need.set(i.productId, (need.get(i.productId) ?? 0) + i.qty);

    return this.prisma.$transaction(async (tx) => {
      for (const [productId, qty] of [...need.entries()].sort(
        (a, b) => a[0] - b[0],
      )) {
        await this.reserveStock(tx, productId, qty);
      }
      return tx.order.create({
        data: { userId, total, discount, promoCode, items: { create: lines } },
        include: { items: true },
      });
    });
  }

  /** Optimistic locking: UPDATE chỉ thành công nếu `version` chưa bị ai đổi */
  private async reserveStock(
    tx: Prisma.TransactionClient,
    productId: number,
    qty: number,
  ) {
    for (let attempt = 0; attempt < 10; attempt++) {
      const p = await tx.product.findUniqueOrThrow({
        where: { id: productId },
      });
      if (p.stock < qty)
        throw new ConflictException(`${p.name} không đủ hàng (còn ${p.stock})`);
      const r = await tx.product.updateMany({
        where: { id: productId, version: p.version },
        data: { stock: { decrement: qty }, version: { increment: 1 } },
      });
      if (r.count === 1) return; // thắng
      // count = 0: có người vừa đổi version, đọc lại và thử tiếp
    }
    throw new ConflictException('Hệ thống đang bận, vui lòng thử lại');
  }

  /** Đổi trạng thái đơn (dùng state machine); hủy đơn thì hoàn kho */
  async changeStatus(orderId: number, to: OrderStatus) {
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
      if (r.count === 0)
        throw new ConflictException('Đơn vừa được cập nhật bởi yêu cầu khác');
      if (to === OrderStatus.CANCELLED) {
        for (const it of order.items)
          await tx.product.update({
            where: { id: it.productId },
            data: { stock: { increment: it.qty }, version: { increment: 1 } },
          });
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
}
