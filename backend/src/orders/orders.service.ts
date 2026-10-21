import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { unitPrice } from '../common/pricing';
import { CreateOrderDto } from './create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateOrderDto) {
    const ids = [...new Set(dto.items.map((i) => i.productId))];
    const products = await this.prisma.product.findMany({
      where: { id: { in: ids } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));

    let total = 0;
    const lines = dto.items.map((i) => {
      const p = byId.get(i.productId);
      if (!p)
        throw new NotFoundException(`Sản phẩm ${i.productId} không tồn tại`);
      const toppings = i.toppings ?? [];
      const lineTotal = unitPrice(p.price, i.size, toppings) * i.qty;
      total += lineTotal;
      return { productId: p.id, size: i.size, toppings, qty: i.qty, lineTotal };
    });

    return this.prisma.order.create({
      data: { userId, total, items: { create: lines } },
      include: { items: true },
    });
  }

  findMine(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: { select: { name: true } } } } },
    });
  }
}
