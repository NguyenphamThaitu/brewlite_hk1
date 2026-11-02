import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class RecipeItemInputDto {
  @IsInt()
  ingredientId: number;

  @IsNumber()
  @Min(0.01)
  amount: number;
}

export class UpdateProductSizeRecipeDto {
  @IsInt()
  productId: number;

  @IsIn(['S', 'M', 'L'])
  size: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeItemInputDto)
  ingredients: RecipeItemInputDto[];
}

export class UpdateToppingRecipeDto {
  @IsString()
  @IsNotEmpty()
  toppingName: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecipeItemInputDto)
  ingredients: RecipeItemInputDto[];
}
