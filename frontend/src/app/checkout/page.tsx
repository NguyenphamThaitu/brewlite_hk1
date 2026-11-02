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
    const [isExpired, setIsExpired] = useState(false);
    const [loading, setLoading] = useState(false);

    // keyRef lưu Idempotency-Key của lần thanh toán hiện tại
    const keyRef = useRef<string | null>(null);
    // networkErrorRef đánh dấu lần thử trước bị lỗi mạng hay không
    const isNetworkRetryRef = useRef<boolean>(false);

    if (!hydrated) return null;
    if (!token) {
        router.push('/login');
        return null;
    }
    if (!items.length) return <p>Giỏ hàng trống.</p>;

    async function submit() {
        setLoading(true);
        setError('');
        setIsExpired(false);

        try {
            let id = orderId;

            // 1. Nếu chưa có đơn (hoặc đơn trước đã hết hạn và bị reset), tạo đơn mới
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

            // 2. Xử lý Idempotency-Key:
            // - Nếu lần trước bị lỗi mạng/timeout (kết quả chưa xác định): tái sử dụng keyRef.current
            // - Nếu là lần thanh toán mới (hoặc thanh toán lại sau khi cổng báo PAYMENT_FAILED): tạo UUID mới
            if (!isNetworkRetryRef.current || !keyRef.current) {
                keyRef.current = crypto.randomUUID();
            }

            const r = await api<{ orderStatus: string }>('/payments', {
                method: 'POST',
                token: token!,
                idempotencyKey: keyRef.current,
                body: JSON.stringify({ orderId: id, method, simulateFail: fail }),
            });

            // Giao dịch đã được máy chủ tiếp nhận và phản hồi thành công
            isNetworkRetryRef.current = false;

            if (r.orderStatus === 'PAID') {
                clear();
                router.push(`/confirmation/${id}`);
            } else {
                // PAYMENT_FAILED: Giữ nguyên orderId để thanh toán lại,
                // nhưng lần thử tiếp theo sẽ là một payment attempt mới (cần key mới)
                keyRef.current = null;
                setError('Thanh toán thất bại. Nguyên liệu giữ chỗ và giỏ hàng được giữ nguyên trong 10 phút, bạn có thể thử lại.');
            }
        } catch (e) {
            const msg = (e as Error).message;
            setError(msg);

            // Kiểm tra lỗi hết hạn giữ chỗ (10 phút)
            if (msg.includes('hết hạn giữ chỗ') || msg.includes('bị hủy')) {
                setIsExpired(true);
                // Reset orderId để lần bấm sau tạo đơn và giữ chỗ lại từ đầu
                setOrderId(null);
                keyRef.current = null;
                isNetworkRetryRef.current = false;
            } else {
                // Đánh dấu có thể là lỗi mạng / timeout không chắc chắn
                isNetworkRetryRef.current = true;
            }
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

            {orderId && (
                <div className="mb-3 rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-800">
                    Đang xử lý đơn hàng <strong>#{orderId}</strong>. Nguyên liệu đã được giữ chỗ trong 10 phút.
                </div>
            )}

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
                    <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-600 space-y-1">
                        <p className="font-semibold">{error}</p>
                        {isExpired && (
                            <p className="text-xs text-red-700">
                                Đơn giữ chỗ cũ đã hết hạn và tự động giải phóng. Bạn có thể bấm nút bên dưới để tạo lại đơn và giữ chỗ mới.
                            </p>
                        )}
                    </div>
                )}

                <button
                    disabled={loading}
                    onClick={submit}
                    className="w-full rounded bg-[#c4956a] px-4 py-2.5 font-semibold text-white hover:bg-[#a97b52] disabled:opacity-60"
                >
                    {loading
                        ? 'Đang xử lý...'
                        : isExpired
                        ? 'Tạo lại đơn & Thanh toán'
                        : orderId
                        ? 'Thử lại thanh toán'
                        : 'Xác nhận trả'}
                </button>
            </div>
        </div>
    );
}