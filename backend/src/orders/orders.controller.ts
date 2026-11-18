import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import type { RequestUser } from '../auth/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';
import { ChangeOrderStatusDto } from './change-order-status.dto';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.userId, dto);
  }

  @Get('me')
  mine(@CurrentUser() user: RequestUser) {
    return this.ordersService.findMine(user.userId);
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findOne(id, user.userId);
  }

  @Post(':id/cancel')
  cancel(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.cancel(id, user.userId, user.role);
  }

  @Patch(':id/status')
  changeStatus(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ChangeOrderStatusDto,
  ) {
    if (user.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Bạn không có quyền thay đổi trạng thái đơn hàng',
      );
    }

    return this.ordersService.changeStatus(id, dto.status);
  }
}
