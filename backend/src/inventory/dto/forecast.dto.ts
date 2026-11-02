import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { SIZE_EXTRA, TOPPING_PRICE, type Size } from '../../common/pricing';

export class ForecastItemDto {
  @IsInt()
  productId: number;

  @IsIn(Object.keys(SIZE_EXTRA))
  size: Size;

  @IsOptional()
  @IsArray()
  @IsIn(Object.keys(TOPPING_PRICE), { each: true })
  toppings?: string[];

  @IsInt()
  @Min(1)
  @Max(100000) // Supports at least 500 cups per product
  qty: number;
}

export class ForecastSalesMixDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ForecastItemDto)
  items: ForecastItemDto[];
}
