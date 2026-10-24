import { OrderStatus as S } from '@prisma/client';
import { assertTransition } from './order-state';

describe('Order state machine', () => {
  it('cho phép luồng thành công', () => {
    expect(() => assertTransition(S.PENDING, S.PAID)).not.toThrow();
    expect(() => assertTransition(S.PAID, S.PREPARING)).not.toThrow();
    expect(() => assertTransition(S.PREPARING, S.READY)).not.toThrow();
    expect(() => assertTransition(S.READY, S.COMPLETED)).not.toThrow();
  });

  it('chặn chuyển trạng thái sai', () => {
    expect(() => assertTransition(S.PENDING, S.COMPLETED)).toThrow();
    expect(() => assertTransition(S.PAID, S.PENDING)).toThrow();
    expect(() => assertTransition(S.COMPLETED, S.PAID)).toThrow();
    expect(() => assertTransition(S.CANCELLED, S.PENDING)).toThrow();
  });
});
