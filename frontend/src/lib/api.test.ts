import { describe, expect, it } from 'vitest';
import { vnd } from './api';

describe('vnd', () => {
    it.each([
        [0, '0đ'],
        [999, '999đ'],
        [1000, '1.000đ'],
        [35000, '35.000đ'],
        [1000000, '1.000.000đ'],
        [1234.5, '1.234,5đ'],
    ])('formats %s as %s', (amount, expected) => {
        expect(vnd(amount)).toBe(expected);
    });
});
