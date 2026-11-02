import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class AdjustStockDto {
  @IsInt()
  ingredientId: number;

  @IsNumber()
  @Min(0)
  actualStock: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
