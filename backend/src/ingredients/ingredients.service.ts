
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IngredientsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.ingredient.findMany({
      select: {
        id: true,
        name: true,
        unit: true,
        stock: true,
        reservedQty: true,
        lowStockThreshold: true,
        version: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
