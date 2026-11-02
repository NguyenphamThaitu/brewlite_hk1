import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { MockGateway } from './mock-gateway';

import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [InventoryModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockGateway],
  exports: [PaymentsService],
})
export class PaymentsModule {}
