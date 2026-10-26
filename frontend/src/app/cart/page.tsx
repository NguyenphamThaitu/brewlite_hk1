'use client';
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
    if (!items.length) return <p>Giỏ hàng trống.</p>;

    return (
        <div className="space-y-3">
            {items.map((i) => (
                <div key={i.key} className="flex items-center justify-between border-b pb-2">
                    <div>
                        {i.name} {i.size} {i.toppings.length > 0 && `(${i.toppings.join(', ')})`}
                        <div>{vnd(i.unitPrice)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setQty(i.key, i.qty - 1)}>–</button>
                        <span>{i.qty}</span>
                        <button onClick={() => setQty(i.key, i.qty + 1)}>+</button>
                        <button onClick={() => remove(i.key)}>Xóa</button>
                    </div>
                </div>
            ))}
            <div className="text-lg font-bold">Tổng: {vnd(cartTotal(items))}</div>
            <button
                className="rounded bg-[#c4956a] hover:bg-[#a97b52] px-4 py-2 text-white"
                onClick={() => router.push(token ? '/checkout' : '/login')}
            >
                Thanh toán
            </button>
        </div>
    );
}