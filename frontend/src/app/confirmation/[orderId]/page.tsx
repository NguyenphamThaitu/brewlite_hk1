'use client';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';

type Order = { id: number; status: string };

export default function ConfirmationPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const token = useAuth((s) => s.token);
    const { data, isLoading } = useQuery({
        queryKey: ['orders', 'me'],
        enabled: !!token,
        queryFn: () => api<Order[]>('/orders/me', { token: token! }),
    });

    if (isLoading) return <p>Đang tải...</p>;
    const o = data?.find((x) => x.id === Number(orderId));
    if (!o) return <p>Không tìm thấy đơn.</p>;

    return (
        <div className="space-y-2 text-center">
            <div className="text-4xl">✓</div>
            <h1 className="text-xl font-bold">Đặt hàng thành công</h1>
            <p>Mã đơn: #{o.id}</p>
            <p>Trạng thái: {o.status}</p>
            <p>Mời tới quầy lấy nước</p>
            <Link href="/" className="underline">Về trang chủ</Link>
        </div>
    );
}