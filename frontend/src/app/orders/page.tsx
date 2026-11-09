
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
    product: { name: string };
};

type Order = {
    id: number;
    status: string;
    total: number;
    items: OrderItem[];
};

type PaginatedOrders = {
    data: Order[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export default function OrdersPage() {
    const hydrated = useHydrated();
    const token = useAuth((s) => s.token);
    const [page, setPage] = useState(1);
    const limit = 5;

    const { data, isLoading, error } = useQuery({
        queryKey: ['orders', 'me', page],
        enabled: !!token,
        queryFn: () =>
            api<PaginatedOrders>(
                `/orders/me?page=${page}&limit=${limit}`,
                { token: token! },
            ),
    });

    if (!hydrated) return null;
    if (!token) return <p>Vui lòng đăng nhập.</p>;
    if (isLoading) return <p>Đang tải...</p>;
    if (error) {
        return (
            <p className="text-red-600">
                {(error as Error).message}
            </p>
        );
    }

    if (!data?.data.length) {
        return <p>Bạn chưa có đơn nào.</p>;
    }

    return (
        <div className="space-y-4">
            <h1 className="text-xl font-bold">Đơn của tôi</h1>

            <p className="text-sm text-gray-500">
                Tổng số đơn hàng: {data.total}
            </p>

            {data.data.map((o) => (
                <div key={o.id} className="rounded border p-3">
                    <div className="font-semibold">
                        #{o.id} · {o.status} · {vnd(o.total)}
                    </div>

                    <div className="text-sm">
                        {o.items
                            .map(
                                (i) =>
                                    `${i.product.name} ${i.size} x${i.qty}`,
                            )
                            .join(', ')}
                    </div>
                </div>
            ))}

            <div className="flex items-center justify-center gap-4">
                <button
                    className="rounded border px-3 py-1 disabled:opacity-40"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                >
                    Trang trước
                </button>

                <span>
                    Trang {data.page} / {data.totalPages}
                </span>

                <button
                    className="rounded border px-3 py-1 disabled:opacity-40"
                    disabled={page >= data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                >
                    Trang sau
                </button>
            </div>
        </div>
    );
}
