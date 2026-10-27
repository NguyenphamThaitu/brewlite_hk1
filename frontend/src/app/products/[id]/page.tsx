'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, vnd } from '@/lib/api';
import type { Product } from '@/lib/types';
import { SIZE_EXTRA, TOPPING_PRICE, unitPrice, type Size } from '@/lib/pricing';
import { useCart } from '@/store/cart';

export default function ProductDetail() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const add = useCart((s) => s.add);
    const { data: p, isLoading, error } = useQuery({
        queryKey: ['product', id],
        queryFn: () => api<Product>(`/products/${id}`),
    });
    const [size, setSize] = useState<Size>('M');
    const [toppings, setToppings] = useState<string[]>([]);

    if (isLoading) return <p>Đang tải...</p>;
    if (error || !p) return <p className="text-red-600">Không tìm thấy sản phẩm</p>;

    const price = unitPrice(p.price, size, toppings);
    const isOutOfStock = p.stock <= 0;
    const toggle = (t: string) =>
        setToppings((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

    return (
        <div className="max-w-md space-y-4">
            <button onClick={() => router.back()}>← {p.name}</button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl} alt={p.name} className="h-48 w-full rounded object-cover" />
            <div>Giá: {vnd(price)}</div>
            {isOutOfStock && (
                <p className="font-semibold text-red-600">
                    Hết hàng
                </p>
            )}
            <div className="flex gap-2">
                {(Object.keys(SIZE_EXTRA) as Size[]).map((s) => (
                    <button
                        key={s}
                        onClick={() => setSize(s)}
                        className={`rounded border px-4 py-1 ${size === s ? 'bg-black text-white' : ''}`}
                    >
                        {s}
                    </button>
                ))}
            </div>
            <div className="flex gap-4">
                {Object.keys(TOPPING_PRICE).map((t) => (
                    <label key={t}>
                        <input type="checkbox" checked={toppings.includes(t)} onChange={() => toggle(t)} /> {t}
                    </label>
                ))}
            </div>
            
            <button
                disabled={isOutOfStock}
                className="rounded bg-amber-700 px-4 py-2 text-white disabled:cursor-not-allowed disabled:bg-gray-400"
                onClick={() => {
                    if (isOutOfStock) return;

                    add({
                        productId: p.id,
                        name: p.name,
                        imageUrl: p.imageUrl,
                        size,
                        toppings,
                        unitPrice: price,
                    });
                    router.push('/cart');
                }}
            >
                {isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>

        </div>
    );
}