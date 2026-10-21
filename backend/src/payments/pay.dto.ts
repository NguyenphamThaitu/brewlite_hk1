import { IsBoolean, IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class PayDto {
  @IsInt()
  orderId: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  // dùng để demo trường hợp thanh toán lỗi
  @IsOptional()
  @IsBoolean()
  simulateFail?: boolean;
}
