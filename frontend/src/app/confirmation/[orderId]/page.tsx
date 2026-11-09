
'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';

type Order = {
    id: number;
    status: string;
};

export default function ConfirmationPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const token = useAuth((s) => s.token);

    const { data, isLoading, error } = useQuery({
        queryKey: ['orders', 'me', orderId],
        enabled: !!token && !!orderId,
        queryFn: () =>
            api<Order>(`/orders/me/${orderId}`, {
                token: token!,
            }),
    });

    if (!token) return <p>Vui lòng đăng nhập.</p>;
    if (isLoading) return <p>Đang tải...</p>;
    if (error || !data) return <p>Không tìm thấy đơn.</p>;

    return (
        <div className="space-y-2 text-center">
            <div className="text-4xl">✓</div>
            <h1 className="text-xl font-bold">Đặt hàng thành công</h1>
            <p>Mã đơn: #{data.id}</p>
            <p>Trạng thái: {data.status}</p>
            <p>Mời tới quầy lấy nước</p>
            <Link href="/" className="underline">
                Về trang chủ
            </Link>
        </div>
    );
}
