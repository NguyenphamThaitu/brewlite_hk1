import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { SIZE_EXTRA, TOPPING_PRICE, type Size } from '../common/pricing';

export class OrderItemDto {
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
  @Max(20)
  qty: number;
}

export class CreateOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsOptional()
  @IsString()
  promoCode?: string;
}
