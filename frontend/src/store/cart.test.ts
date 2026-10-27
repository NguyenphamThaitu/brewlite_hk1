import { describe, expect, it } from 'vitest';
import { cartCount, type CartItem } from './cart';

function makeItem(overrides: Partial<CartItem> = {}): CartItem {
    return {
        key: '1|S|',
        productId: 1,
        name: 'Cà phê sữa',
        imageUrl: '/coffee.png',
        size: 'S',
        toppings: [],
        unitPrice: 35000,
        qty: 1,
        ...overrides,
    };
}

describe('cartCount', () => {
    it('returns zero for an empty cart', () => {
        expect(cartCount([])).toBe(0);
    });

    it('counts one drink', () => {
        expect(cartCount([makeItem()])).toBe(1);
    });

    it('counts the quantity of a single cart line', () => {
        expect(cartCount([makeItem({ qty: 3 })])).toBe(3);
    });

    it('adds quantities across cart lines instead of counting lines', () => {
        const items = [
            makeItem({ qty: 2 }),
            makeItem({ key: '2|M|', productId: 2, size: 'M', qty: 3 }),
        ];

        expect(cartCount(items)).toBe(5);
    });

    it('does not add drinks for a line with zero quantity', () => {
        const items = [
            makeItem({ qty: 0 }),
            makeItem({ key: '2|S|', productId: 2, qty: 4 }),
        ];

        expect(cartCount(items)).toBe(4);
    });

    it('keeps the input array and items unchanged', () => {
        const items = [
            makeItem({ qty: 2, toppings: ['Kem'] }),
            makeItem({ key: '2|L|', productId: 2, size: 'L', qty: 3 }),
        ];
        const original = structuredClone(items);

        expect(cartCount(items)).toBe(5);
        expect(items).toEqual(original);
    });
});
