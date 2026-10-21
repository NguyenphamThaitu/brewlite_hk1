import { Injectable } from '@nestjs/common';

// Mô phỏng cổng thanh toán (Momo/VNPay/Stripe)
@Injectable()
export class MockGateway {
  async charge(_amount: number, _method: string, simulateFail = false) {
    await new Promise((r) => setTimeout(r, 300));
    return { ok: !simulateFail };
  }
}
