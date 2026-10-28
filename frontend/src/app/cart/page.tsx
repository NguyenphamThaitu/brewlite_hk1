'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { cartTotal, useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { useHydrated } from '@/lib/useHydrated';
import { vnd } from '@/lib/api';

export default function CartPage() {
    const hydrated = useHydrated();
    const router = useRouter();
    const items = useCart((s) => s.items);
    const setQty = useCart((s) => s.setQty);
    const remove = useCart((s) => s.remove);
    const token = useAuth((s) => s.token);

    if (!hydrated) return null;

    if (!items.length)
        return (
            <div className="mt-10 text-center">
                <p className="mb-4 text-gray-600">Giỏ hàng trống.</p>
                <Link
                    href="/"
                    className="inline-block rounded bg-[#0f3a52] px-5 py-2 font-semibold text-white hover:bg-[#c4956a]"
                >
                    Xem menu
                </Link>
            </div>
        );

    const qtyBtn =
        'flex h-8 w-8 items-center justify-center rounded border border-[#0f3a52] font-bold text-[#0f3a52] hover:border-[#c4956a] hover:bg-[#c4956a] hover:text-white';

    return (
        <div>
            <h1 className="mb-4 border-b border-gray-300 pb-3 text-center text-2xl font-semibold uppercase tracking-wide text-[#0f3a52]">
                Giỏ hàng
            </h1>

            <div className="space-y-3">
                {items.map((i) => (
                    <div
                        key={i.key}
                        className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-3 shadow-sm transition hover:border-[#c4956a] hover:shadow-md"
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={i.imageUrl} alt={i.name} className="h-16 w-16 rounded object-cover" />
                        <div className="flex-1">
                            <div className="font-semibold uppercase text-[#0f3a52]">
                                {i.name} <span className="text-[#c4956a]">({i.size})</span>
                            </div>
                            {i.toppings.length > 0 && (
                                <div className="text-sm text-gray-600">{i.toppings.join(', ')}</div>
                            )}
                            <div className="font-semibold text-[#c4956a]">{vnd(i.unitPrice)}</div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className={qtyBtn} onClick={() => setQty(i.key, i.qty - 1)}>
                                –
                            </button>
                            <span className="w-6 text-center font-semibold">{i.qty}</span>
                            <button className={qtyBtn} onClick={() => setQty(i.key, i.qty + 1)}>
                                +
                            </button>
                            <button
                                className="ml-2 rounded px-2 py-1 text-sm font-semibold text-red-600 hover:bg-red-50"
                                onClick={() => remove(i.key)}
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-lg bg-[#0f3a52] p-4 text-white">
                <span className="text-lg font-semibold uppercase tracking-wide">Tổng</span>
                <span className="text-xl font-bold text-[#e0b58c]">{vnd(cartTotal(items))}</span>
            </div>

            <div className="mt-4 text-right">
                <button
                    className="rounded bg-[#c4956a] px-6 py-2 font-semibold text-white hover:bg-[#a97b52]"
                    onClick={() => router.push(token ? '/checkout' : '/login')}
                >
                    Thanh toán
                </button>
            </div>
        </div>
    );
}