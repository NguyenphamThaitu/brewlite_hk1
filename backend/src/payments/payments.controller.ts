import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PaymentsService } from './payments.service';
import { PayDto } from './pay.dto';

@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  pay(
    @CurrentUser() user: { userId: number },
    @Headers('idempotency-key') key: string,
    @Body() dto: PayDto,
  ) {
    if (!key) throw new BadRequestException('Thiếu header Idempotency-Key');
    return this.paymentsService.pay(user.userId, key, dto);
  }
}
