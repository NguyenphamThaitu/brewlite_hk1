import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { InventoryService } from './inventory.service';
import { InventoryCalculationService } from './inventory-calculation.service';
import { ForecastSalesMixDto } from './dto/forecast.dto';
import { StockInDto } from './dto/stock-in.dto';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import {
  UpdateProductSizeRecipeDto,
  UpdateToppingRecipeDto,
} from './dto/update-recipe.dto';

@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly inventoryService: InventoryService,
    private readonly calculationService: InventoryCalculationService,
  ) {}

  /**
   * Dự báo nguyên liệu theo cơ cấu doanh số bán hàng dự kiến (hỗ trợ 500+ ly/món).
   * Không tạo đơn hàng, không giữ chỗ, không làm thay đổi tồn kho thực tế.
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('forecast')
  forecast(@Body() dto: ForecastSalesMixDto) {
    return this.calculationService.calculate(dto.items);
  }

  /**
   * Danh sách số dư nguyên liệu, tồn thực tế, số lượng giữ chỗ và cảnh báo thiếu hàng
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('ingredients')
  findAllIngredients() {
    return this.inventoryService.findAllIngredients();
  }

  /**
   * Nhập kho nguyên liệu
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('stock-in')
  stockIn(@Body() dto: StockInDto) {
    return this.inventoryService.stockIn(dto);
  }

  /**
   * Điều chỉnh kiểm kê tồn kho (có giải trình)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post('adjust')
  adjustStock(@Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(dto);
  }

  /**
   * Danh sách công thức món và topping
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('recipes')
  getRecipes() {
    return this.inventoryService.getAllRecipes();
  }

  /**
   * Quản lý công thức theo sản phẩm và size
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('recipes/product')
  updateProductRecipe(@Body() dto: UpdateProductSizeRecipeDto) {
    return this.inventoryService.updateProductSizeRecipe(dto);
  }

  /**
   * Quản lý công thức cho topping
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Put('recipes/topping')
  updateToppingRecipe(@Body() dto: UpdateToppingRecipeDto) {
    return this.inventoryService.updateToppingRecipe(dto);
  }

  /**
   * Báo cáo cân đối xuất-nhập-tồn kho theo ngày (múi giờ Asia/Ho_Chi_Minh)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Get('reports/daily')
  getDailyReport(@Query('date') date?: string) {
    return this.inventoryService.getDailyReport(date);
  }

  /**
   * Kiểm tra khả năng pha chế và ước tính số ly độc lập cho một biến thể (dành cho trang chi tiết món)
   */
  @Get('product-availability/:id')
  checkProductAvailability(
    @Param('id', ParseIntPipe) id: number,
    @Query('size') size: string = 'M',
    @Query('toppings') toppingsQuery?: string,
  ) {
    const toppings = toppingsQuery
      ? toppingsQuery.split(',').map((t) => t.trim()).filter(Boolean)
      : [];
    return this.calculationService.estimateVariantAvailableCups(
      id,
      size,
      toppings,
    );
  }
}
