'use client';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api, vnd } from '@/lib/api';
import type { Product, VariantAvailability } from '@/lib/types';
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

    // Kiểm tra khả năng pha chế theo tồn kho nguyên liệu thời gian thực
    const { data: availability, isLoading: isCheckingAvailability } = useQuery({
        queryKey: ['product-availability', id, size, toppings.sort().join(',')],
        retry: false,
        queryFn: () =>
            api<VariantAvailability>(
                `/inventory/product-availability/${id}?size=${size}&toppings=${encodeURIComponent(toppings.join(','))}`,
            ),
    });

    if (isLoading) return <p>Đang tải...</p>;
    if (error || !p) return <p className="text-red-600">Không tìm thấy sản phẩm</p>;

    const price = unitPrice(p.price, size, toppings);
    const isOutOfStock = availability ? !availability.available : false;

    const toggle = (t: string) =>
        setToppings((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));

    return (
        <div className="max-w-md space-y-4">
            <button onClick={() => router.back()} className="text-sm font-semibold text-[#0f3a52] hover:underline">
                ← Quay lại ({p.name})
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.imageUrl} alt={p.name} className="h-48 w-full rounded-lg object-cover shadow-sm" />
            
            <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xl font-bold text-[#0f3a52]">{p.name}</span>
                <span className="text-xl font-bold text-[#c4956a]">{vnd(price)}</span>
            </div>

            {/* Cảnh báo hết nguyên liệu (nếu có) */}
            {isOutOfStock && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    <p className="font-semibold">⚠️ Hết nguyên liệu pha chế cho tùy chọn này</p>
                    {availability?.limitingIngredient && (
                        <p className="text-xs text-red-500">
                            Giới hạn bởi: {availability.limitingIngredient} (không đủ định lượng)
                        </p>
                    )}
                </div>
            )}

            {/* Chọn Size */}
            <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Chọn kích thước:
                </label>
                <div className="flex gap-2">
                    {(Object.keys(SIZE_EXTRA) as Size[]).map((s) => (
                        <button
                            key={s}
                            onClick={() => setSize(s)}
                            className={`rounded-lg border px-5 py-2 font-semibold transition ${
                                size === s
                                    ? 'border-[#0f3a52] bg-[#0f3a52] text-white shadow'
                                    : 'border-gray-300 text-[#0f3a52] hover:border-[#c4956a] hover:bg-[#c4956a] hover:text-white'
                            }`}
                        >
                            {s} {SIZE_EXTRA[s] > 0 ? `(+${vnd(SIZE_EXTRA[s])})` : ''}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tùy chọn Custom */}
            <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                    Custom:
                </label>
                <div className="flex flex-wrap gap-4">
                    {Object.keys(TOPPING_PRICE).map((t) => (
                        <label key={t} className="flex cursor-pointer items-center gap-2 rounded border border-gray-200 px-3 py-1.5 text-sm transition hover:border-[#c4956a]">
                            <input
                                type="checkbox"
                                className="accent-[#0f3a52]"
                                checked={toppings.includes(t)}
                                onChange={() => toggle(t)}
                            />
                            <span>
                                + {t} (+{vnd(TOPPING_PRICE[t])})
                            </span>
                        </label>
                    ))}
                </div>
            </div>
            
            <button
                disabled={isOutOfStock || isCheckingAvailability}
                className="w-full rounded-lg bg-[#c4956a] py-3 font-semibold text-white shadow transition hover:bg-[#a97b52] disabled:cursor-not-allowed disabled:bg-gray-400"
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
                {isOutOfStock ? 'Tạm hết nguyên liệu' : 'Thêm vào giỏ hàng'}
            </button>
        </div>
    );
}