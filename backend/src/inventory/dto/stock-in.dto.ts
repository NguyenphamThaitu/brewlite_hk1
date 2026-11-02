import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class StockInDto {
  @IsInt()
  ingredientId: number;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
