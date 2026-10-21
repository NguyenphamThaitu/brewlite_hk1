'use client';
import { useQuery } from '@tanstack/react-query';
import { api, vnd } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useHydrated } from '@/lib/useHydrated';

type OrderItem = { id: number; size: string; qty: number; product: { name: string } };
type Order = { id: number; status: string; total: number; items: OrderItem[] };

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
        <div className="space-y-3">
            <h1 className="text-xl font-bold">Đơn của tôi</h1>
            {data.map((o) => (
                <div key={o.id} className="rounded border p-3">
                    <div className="font-semibold">
                        #{o.id} · {o.status} · {vnd(o.total)}
                    </div>
                    <div className="text-sm">
                        {o.items.map((i) => `${i.product.name} ${i.size} x${i.qty}`).join(', ')}
                    </div>
                </div>
            ))}
        </div>
    );
}