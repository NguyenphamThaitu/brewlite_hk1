export const SIZE_EXTRA = { S: 0, M: 5000, L: 10000 } as const;
export type Size = keyof typeof SIZE_EXTRA;

export const TOPPING_PRICE: Record<string, number> = {
  'Trân châu': 5000,
  Kem: 5000,
};

export function unitPrice(base: number, size: Size, toppings: string[]) {
  return (
    base +
    SIZE_EXTRA[size] +
    toppings.reduce((sum, t) => sum + (TOPPING_PRICE[t] ?? 0), 0)
  );
}
