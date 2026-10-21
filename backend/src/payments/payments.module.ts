import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockGateway } from './mock-gateway';

@Module({
  controllers: [PaymentsController],
  providers: [PaymentsService, MockGateway],
})
export class PaymentsModule {}
