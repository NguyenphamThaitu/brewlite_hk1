import { BadRequestException } from '@nestjs/common';
import { OrderStatus as S } from '@prisma/client';

const TRANSITIONS: Record<S, S[]> = {
  PENDING: [S.PAID, S.PAYMENT_FAILED, S.CANCELLED],
  PAYMENT_FAILED: [S.PENDING, S.CANCELLED], // thử lại hoặc hủy
  PAID: [S.PREPARING, S.CANCELLED],
  PREPARING: [S.READY],
  READY: [S.COMPLETED],
  COMPLETED: [], // trạng thái kết thúc
  CANCELLED: [], // trạng thái kết thúc
};

export const canTransition = (from: S, to: S) => TRANSITIONS[from].includes(to);

export function assertTransition(from: S, to: S) {
  if (!canTransition(from, to))
    throw new BadRequestException(
      `Không thể chuyển trạng thái ${from} → ${to}`,
    );
}
