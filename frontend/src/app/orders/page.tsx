'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, vnd } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useHydrated } from '@/lib/useHydrated';

type OrderItem = {
    id: number;
    size: string;
    qty: number;
    toppings: string[];
    product: { name: string };
};
type Order = { id: number; status: string; total: number; items: OrderItem[] };

const STATUS_COLOR: Record<string, string> = {
    PENDING: 'bg-[#c4956a]',
    PAID: 'bg-[#0f3a52]',
    PREPARING: 'bg-[#a97b52]',
    READY: 'bg-[#2f855a]',
    COMPLETED: 'bg-[#2f855a]',
    PAYMENT_FAILED: 'bg-red-600',
    CANCELLED: 'bg-gray-500',
};

export default function OrdersPage() {
    const hydrated = useHydrated();
    const token = useAuth((s) => s.token);
    const [cancellingId, setCancellingId] = useState<number | null>(null);
    const [cancelMsg, setCancelMsg] = useState<{ id: number; text: string; isError?: boolean } | null>(null);

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['orders', 'me'],
        enabled: !!token,
        queryFn: () => api<Order[]>('/orders/me', { token: token! }),
    });

    if (!hydrated) return null;
    if (!token) return <p>Vui lòng đăng nhập.</p>;
    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-600">{(error as Error).message}</p>;
    if (!data?.length) return <p>Bạn chưa có đơn nào.</p>;

    async function handleCancel(orderId: number) {
        if (!confirm(`Bạn có chắc chắn muốn hủy đơn hàng #${orderId}?`)) return;
        setCancellingId(orderId);
        setCancelMsg(null);
        try {
            await api(`/orders/${orderId}/cancel`, {
                method: 'POST',
                token: token!,
            });
            setCancelMsg({ id: orderId, text: 'Hủy đơn thành công. Nguyên liệu giữ chỗ đã được giải phóng.' });
            await refetch();
        } catch (e) {
            setCancelMsg({ id: orderId, text: (e as Error).message, isError: true });
        } finally {
            setCancellingId(null);
        }
    }

    return (
        <div>
            <h1 className="mb-4 border-b border-gray-300 pb-3 text-center text-2xl font-semibold uppercase tracking-wide text-[#0f3a52]">
                Đơn của tôi
            </h1>
            <div className="space-y-3">
                {data.map((o) => {
                    const isEligibleToCancel =
                        o.status === 'PENDING' ||
                        o.status === 'PAYMENT_FAILED' ||
                        o.status === 'PAID';

                    return (
                        <div
                            key={o.id}
                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#c4956a] hover:shadow-md"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-lg font-bold text-[#0f3a52]">#{o.id}</span>
                                    <span
                                        className={`rounded-full px-3 py-0.5 text-xs font-semibold text-white ${
                                            STATUS_COLOR[o.status] ?? 'bg-gray-500'
                                        }`}
                                    >
                                        {o.status}
                                    </span>
                                </div>
                                <span className="text-lg font-semibold text-[#c4956a]">{vnd(o.total)}</span>
                            </div>

                            <div className="mt-2 text-sm text-gray-600">
                                {o.items
                                    .map(
                                        (i) =>
                                            `${i.product.name} ${i.size} x${i.qty}${
                                                i.toppings?.length ? ` (${i.toppings.join(', ')})` : ''
                                            }`,
                                    )
                                    .join(', ')}
                            </div>

                            {cancelMsg && cancelMsg.id === o.id && (
                                <p
                                    className={`mt-2 text-xs font-semibold ${
                                        cancelMsg.isError ? 'text-red-600' : 'text-green-600'
                                    }`}
                                >
                                    {cancelMsg.text}
                                </p>
                            )}

                            {isEligibleToCancel && (
                                <div className="mt-3 flex justify-end">
                                    <button
                                        disabled={cancellingId === o.id}
                                        onClick={() => handleCancel(o.id)}
                                        className="rounded border border-red-300 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {cancellingId === o.id ? 'Đang hủy...' : 'Hủy đơn hàng'}
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}