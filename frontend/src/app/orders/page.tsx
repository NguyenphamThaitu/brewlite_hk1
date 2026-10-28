'use client';
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
    const { data, isLoading, error } = useQuery({
        queryKey: ['orders', 'me'],
        enabled: !!token,
        queryFn: () => api<Order[]>('/orders/me', { token: token! }),
    });

    if (!hydrated) return null;
    if (!token) return <p>Vui lòng đăng nhập.</p>;
    if (isLoading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-600">{(error as Error).message}</p>;
    if (!data?.length) return <p>Bạn chưa có đơn nào.</p>;

    return (
        <div>
            <h1 className="mb-4 border-b border-gray-300 pb-3 text-center text-2xl font-semibold uppercase tracking-wide text-[#0f3a52]">
                Đơn của tôi
            </h1>
            <div className="space-y-3">
                {data.map((o) => (
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
                    </div>
                ))}
            </div>
        </div>
    );
}