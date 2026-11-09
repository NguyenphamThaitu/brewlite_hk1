import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  CreatePromotionDto,
  UpdatePromotionDto,
} from './admin.controller';
import { Order, OrderItem, OrderStatus, Product } from '@prisma/client';

type OrderWithItemsAndProduct = Order & {
  items: Array<OrderItem & { product: Product }>;
};

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // =================== 1. QUẢN LÝ MÓN (CRUD PRODUCTS) ===================

  async getProducts() {
    return this.prisma.product.findMany({
      orderBy: { id: 'asc' },
      include: {
        recipeItems: {
          include: { ingredient: true },
        },
      },
    });
  }

  async createProduct(dto: CreateProductDto) {
    const defaultImage =
      dto.imageUrl ||
      'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600';

    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          name: dto.name.trim(),
          price: dto.price,
          imageUrl: defaultImage,
          category: dto.category?.trim() || 'Cà phê truyền thống',
          isActive: dto.isActive !== undefined ? dto.isActive : true,
        },
      });

      // Tự động khởi tạo công thức định lượng cơ bản (Cà phê hạt / bột: S=20g, M=25g, L=30g)
      // để món mới có thể bán và kiểm tra tồn kho được ngay lập tức
      const defaultIng = await tx.ingredient.findFirst({
        where: { name: 'Cà phê hạt / bột' },
      });

      if (defaultIng) {
        await tx.recipeItem.createMany({
          data: [
            { productId: product.id, size: 'S', ingredientId: defaultIng.id, amount: 20 },
            { productId: product.id, size: 'M', ingredientId: defaultIng.id, amount: 25 },
            { productId: product.id, size: 'L', ingredientId: defaultIng.id, amount: 30 },
          ],
        });
      }

      return product;
    });
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ID #${id}`);
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name.trim() }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.category !== undefined && { category: dto.category.trim() }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async deleteProduct(id: number) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ID #${id}`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Xóa các dòng công thức định lượng của món
      await tx.recipeItem.deleteMany({ where: { productId: id } });

      // 2. Xóa các dòng đơn hàng liên kết (nếu có)
      await tx.orderItem.deleteMany({ where: { productId: id } });

      // 3. Xóa vĩnh viễn món khỏi DB
      return tx.product.delete({ where: { id } });
    });
  }

  // =================== 2. QUẢN LÝ KHUYẾN MÃI (PROMOTIONS) ===================

  async getPromotions() {
    return this.prisma.promotion.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPromotion(dto: CreatePromotionDto) {
    const code = dto.code.trim().toUpperCase();
    const existing = await this.prisma.promotion.findUnique({ where: { code } });
    if (existing) {
      throw new BadRequestException(`Mã khuyến mãi ${code} đã tồn tại`);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : null;
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('Ngày bắt đầu không thể sau ngày kết thúc');
    }

    return this.prisma.promotion.create({
      data: {
        code,
        percent: dto.percent,
        minOrderValue: dto.minOrderValue ?? 0,
        usageLimit: dto.usageLimit ?? null,
        usedCount: 0,
        startDate,
        endDate,
        active: dto.active !== undefined ? dto.active : true,
      },
    });
  }

  async updatePromotion(code: string, dto: UpdatePromotionDto) {
    const cleanCode = code.trim().toUpperCase();
    const existing = await this.prisma.promotion.findUnique({
      where: { code: cleanCode },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy mã khuyến mãi ${cleanCode}`);
    }

    const startDate =
      dto.startDate !== undefined
        ? dto.startDate
          ? new Date(dto.startDate)
          : null
        : existing.startDate;
    const endDate =
      dto.endDate !== undefined
        ? dto.endDate
          ? new Date(dto.endDate)
          : null
        : existing.endDate;

    if (startDate && endDate && startDate > endDate) {
      throw new BadRequestException('Ngày bắt đầu không thể sau ngày kết thúc');
    }

    return this.prisma.promotion.update({
      where: { code: cleanCode },
      data: {
        ...(dto.percent !== undefined && { percent: dto.percent }),
        ...(dto.minOrderValue !== undefined && { minOrderValue: dto.minOrderValue }),
        ...(dto.usageLimit !== undefined && { usageLimit: dto.usageLimit }),
        ...(dto.active !== undefined && { active: dto.active }),
        startDate,
        endDate,
      },
    });
  }

  async deletePromotion(code: string) {
    const cleanCode = code.trim().toUpperCase();
    const existing = await this.prisma.promotion.findUnique({
      where: { code: cleanCode },
    });
    if (!existing) {
      throw new NotFoundException(`Không tìm thấy mã khuyến mãi ${cleanCode}`);
    }

    return this.prisma.promotion.delete({
      where: { code: cleanCode },
    });
  }

  // =================== 3. BÁO CÁO DOANH THU THEO KHOẢNG THỜI GIAN ===================

  async getRevenueReport(startDateStr?: string, endDateStr?: string) {
    const parseVnDate = (dStr: string) => {
      const [y, m, d] = dStr.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
    };

    const getTodayVn = () => {
      const nowUtc = Date.now();
      const vnTime = new Date(nowUtc + 7 * 60 * 60 * 1000);
      return new Date(
        Date.UTC(vnTime.getUTCFullYear(), vnTime.getUTCMonth(), vnTime.getUTCDate(), 0, 0, 0),
      );
    };

    let startTargetDate: Date;
    if (startDateStr && /^\d{4}-\d{2}-\d{2}$/.test(startDateStr)) {
      startTargetDate = parseVnDate(startDateStr);
    } else {
      startTargetDate = getTodayVn();
    }

    let endTargetDate: Date;
    if (endDateStr && /^\d{4}-\d{2}-\d{2}$/.test(endDateStr)) {
      endTargetDate = parseVnDate(endDateStr);
    } else {
      endTargetDate = startTargetDate;
    }

    // Đảm bảo start <= end
    if (startTargetDate > endTargetDate) {
      const temp = startTargetDate;
      startTargetDate = endTargetDate;
      endTargetDate = temp;
    }

    // start: 00:00:00 UTC+7 => trừ 7h UTC
    // end: 23:59:59.999 UTC+7 => trừ 7h + 24h - 1ms
    const rangeStart = new Date(startTargetDate.getTime() - 7 * 60 * 60 * 1000);
    const rangeEnd = new Date(endTargetDate.getTime() - 7 * 60 * 60 * 1000 + 24 * 60 * 60 * 1000 - 1);

    const startFormatted = startTargetDate.toISOString().split('T')[0];
    const endFormatted = endTargetDate.toISOString().split('T')[0];

    // Lấy các đơn hàng trong khoảng ngày
    const orders: OrderWithItemsAndProduct[] = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: rangeStart, lte: rangeEnd },
      },
      include: {
        items: {
          include: { product: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Chỉ tính các đơn đã thanh toán hoặc đã hoàn thành
    const validOrders = orders.filter(
      (o: OrderWithItemsAndProduct) =>
        o.status === OrderStatus.PAID ||
        o.status === OrderStatus.PREPARING ||
        o.status === OrderStatus.READY ||
        o.status === OrderStatus.COMPLETED,
    );
    const cancelledOrders = orders.filter(
      (o: OrderWithItemsAndProduct) => o.status === OrderStatus.CANCELLED,
    );
    const failedOrders = orders.filter(
      (o: OrderWithItemsAndProduct) => o.status === OrderStatus.PAYMENT_FAILED,
    );

    const totalRevenue = validOrders.reduce((sum: number, o: OrderWithItemsAndProduct) => sum + o.total, 0);
    const totalDiscount = validOrders.reduce((sum: number, o: OrderWithItemsAndProduct) => sum + o.discount, 0);
    const averageOrderValue =
      validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

    // Tổng hợp món bán chạy
    const productStats = new Map<
      number,
      { id: number; name: string; totalQty: number; totalSales: number }
    >();

    for (const order of validOrders) {
      for (const item of order.items) {
        const prod = item.product;
        const cur = productStats.get(prod.id) ?? {
          id: prod.id,
          name: prod.name,
          totalQty: 0,
          totalSales: 0,
        };
        cur.totalQty += item.qty;
        cur.totalSales += item.lineTotal;
        productStats.set(prod.id, cur);
      }
    }

    const topSellingProducts = Array.from(productStats.values()).sort(
      (a, b) => b.totalSales - a.totalSales,
    );

    return {
      date: startFormatted === endFormatted ? startFormatted : `${startFormatted} ~ ${endFormatted}`,
      startDate: startFormatted,
      endDate: endFormatted,
      timezone: 'Asia/Ho_Chi_Minh (UTC+7)',
      summary: {
        totalRevenue,
        grossRevenue: totalRevenue + totalDiscount,
        totalDiscount,
        totalOrders: orders.length,
        successfulOrders: validOrders.length,
        cancelledOrders: cancelledOrders.length,
        failedOrders: failedOrders.length,
        averageOrderValue,
      },
      topSellingProducts,
      recentOrders: validOrders.slice(0, 200).map((o: OrderWithItemsAndProduct) => ({
        id: o.id,
        total: o.total,
        originalTotal: o.total + o.discount,
        discount: o.discount,
        promoCode: o.promoCode,
        status: o.status,
        itemCount: o.items.reduce((s: number, it: OrderItem) => s + it.qty, 0),
        createdAt: o.createdAt,
      })),
    };
  }
}
