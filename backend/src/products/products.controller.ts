import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ProductsService } from './products.service';
import { InventoryCalculationService } from '../inventory/inventory-calculation.service';

@Controller('products')
export class ProductsController {
   constructor(
    private readonly productsService: ProductsService,
    private readonly invencaculationtoryService: InventoryCalculationService,
  ) {}

  @Get()
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }
    // Kiểm tra số ly có thể mua
  @Get(':id/available-cups')
  estimateAvailableCups(
    @Param('id', ParseIntPipe) productId: number,
    @Query('size') size: string,
    @Query('toppings') toppings?: string,
  ) {
    const toppingList = toppings ? toppings.split(',') : [];

    return this.invencaculationtoryService.estimateVariantAvailableCups(
      productId,
      size,
      toppingList,
    );
  }
}
