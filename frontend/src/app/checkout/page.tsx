'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, vnd } from '@/lib/api';
import { cartTotal, useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { useHydrated } from '@/lib/useHydrated';

export default function CheckoutPage() {
    const hydrated = useHydrated();
    const router = useRouter();
    const items = useCart((s) => s.items);
    const clear = useCart((s) => s.clear);
    const token = useAuth((s) => s.token);

    const [method, setMethod] = useState<'WALLET' | 'CARD'>('WALLET');
    const [promo, setPromo] = useState('');
    const [fail, setFail] = useState(false);
    const [orderId, setOrderId] = useState<number | null>(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const keyRef = useRef<string | null>(null);

    if (!hydrated) return null;
    if (!token) {
        router.push('/login');
        return null;
    }
    if (!items.length) return <p>Giỏ hàng trống.</p>;

    async function submit() {
        setLoading(true);
        setError('');
        try {
            let id = orderId;
            if (!id) {
                const o = await api<{ id: number }>('/orders', {
                    method: 'POST',
                    token: token!,
                    body: JSON.stringify({
                        items: items.map((i) => ({
                            productId: i.productId,
                            size: i.size,
                            toppings: i.toppings,
                            qty: i.qty,
                        })),
                        promoCode: promo.trim() || undefined,
                    }),
                });
                id = o.id;
                setOrderId(id);
            }
            keyRef.current = crypto.randomUUID();
            const r = await api<{ orderStatus: string }>('/payments', {
                method: 'POST',
                token: token!,
                idempotencyKey: keyRef.current,
                body: JSON.stringify({ orderId: id, method, simulateFail: fail }),
            });
            if (r.orderStatus === 'PAID') {
                clear();
                router.push(`/confirmation/${id}`);
            } else {
                setError('Thanh toán thất bại. Giỏ hàng được giữ nguyên, bạn có thể thử lại.');
            }
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    }

    const option = (active: boolean) =>
        `flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition ${
            active
                ? 'border-[#0f3a52] bg-[#0f3a52]/5'
                : 'border-gray-200 hover:border-[#c4956a]'
        }`;

    return (
        <div className="mx-auto max-w-md">
            <h1 className="mb-4 border-b border-gray-300 pb-3 text-center text-2xl font-semibold uppercase tracking-wide text-[#0f3a52]">
                Thanh toán
            </h1>

            <div className="mb-4 flex items-center justify-between rounded-lg bg-[#0f3a52] p-4 text-white">
                <span className="font-semibold uppercase tracking-wide">Tạm tính</span>
                <span className="text-xl font-bold text-[#e0b58c]">{vnd(cartTotal(items))}</span>
            </div>

            <div className="space-y-3">
                <input
                    className="w-full rounded border border-gray-300 p-2 outline-none focus:border-[#c4956a] focus:ring-1 focus:ring-[#c4956a]"
                    placeholder="Mã khuyến mãi (vd: BREW10)"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    disabled={!!orderId}
                />

                <div className="space-y-2">
                    <label className={option(method === 'WALLET')}>
                        <input
                            type="radio"
                            className="accent-[#0f3a52]"
                            checked={method === 'WALLET'}
                            onChange={() => setMethod('WALLET')}
                        />
                        <span className="font-semibold text-[#0f3a52]">Ví điện tử</span>
                    </label>
                    <label className={option(method === 'CARD')}>
                        <input
                            type="radio"
                            className="accent-[#0f3a52]"
                            checked={method === 'CARD'}
                            onChange={() => setMethod('CARD')}
                        />
                        <span className="font-semibold text-[#0f3a52]">Thẻ ngân hàng</span>
                    </label>
                </div>

                <p className="text-sm text-gray-500">Không dùng tiền mặt</p>

                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
                    <input
                        type="checkbox"
                        className="accent-[#0f3a52]"
                        checked={fail}
                        onChange={(e) => setFail(e.target.checked)}
                    />
                    (Demo) Giả lập thanh toán lỗi
                </label>

                {error && (
                    <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
                        {error}
                    </p>
                )}

                <button
                    disabled={loading}
                    onClick={submit}
                    className="w-full rounded bg-[#c4956a] px-4 py-2.5 font-semibold text-white hover:bg-[#a97b52] disabled:opacity-60"
                >
                    {loading ? 'Đang xử lý...' : 'Xác nhận trả'}
                </button>
            </div>
        </div>
    );
}