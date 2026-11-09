
import {
  BadRequestException,
  Controller,
  Get,
  Post,
  UseGuards,
  Body,
  Query,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './create-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@CurrentUser() user: { userId: number }, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.userId, dto);
  }

  @Get('me')
  async mine(
    @CurrentUser() user: { userId: number },
    @Query('page') page = '1',
    @Query('limit') limit = '10',
  ) {
    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    if (!Number.isInteger(pageNumber) || pageNumber < 1) {
      throw new BadRequestException('Page must be a positive integer');
    }

    if (
      !Number.isInteger(limitNumber) ||
      limitNumber < 1 ||
      limitNumber > 50
    ) {
      throw new BadRequestException('Limit must be between 1 and 50');
    }

    return this.ordersService.findMine(
      user.userId,
      pageNumber,
      limitNumber,
    );
  }

  @Get('me/:id')
  findMineById(
    @CurrentUser() user: { userId: number },
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.ordersService.findMineById(user.userId, id);
  }
}
