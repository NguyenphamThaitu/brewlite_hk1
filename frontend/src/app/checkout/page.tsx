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

    return (
        <div className="max-w-sm space-y-3">
            <h1 className="text-xl font-bold">Thanh toán</h1>
            <div>Tạm tính: {vnd(cartTotal(items))}</div>
            <input
                className="w-full rounded border p-2"
                placeholder="Mã khuyến mãi (vd: BREW10)"
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                disabled={!!orderId}
            />
            <label className="block">
                <input type="radio" checked={method === 'WALLET'} onChange={() => setMethod('WALLET')} /> Ví điện tử
            </label>
            <label className="block">
                <input type="radio" checked={method === 'CARD'} onChange={() => setMethod('CARD')} /> Thẻ ngân hàng
            </label>
            <p className="text-sm text-gray-500">Không dùng tiền mặt</p>
            <label className="block text-sm">
                <input type="checkbox" checked={fail} onChange={(e) => setFail(e.target.checked)} /> (Demo) Giả lập thanh toán lỗi
            </label>
            {error && <p className="text-red-600">{error}</p>}
            <button disabled={loading} onClick={submit} className="rounded bg-[#c4956a] hover:bg-[#a97b52] px-4 py-2 text-white">
                {loading ? 'Đang xử lý...' : 'Xác nhận trả'}
            </button>
        </div>
    );
}