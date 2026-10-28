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

    const paid = o.status === 'PAID';

    return (
        <div className="mx-auto mt-6 max-w-md rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#c4956a] text-3xl font-bold text-white">
                ✓
            </div>
            <h1 className="mb-4 text-2xl font-semibold uppercase tracking-wide text-[#0f3a52]">
                Đặt hàng thành công
            </h1>
            <div className="space-y-2">
                <p>
                    Mã đơn: <span className="font-semibold text-[#c4956a]">#{o.id}</span>
                </p>
                <p>
                    Trạng thái:{' '}
                    <span
                        className={`rounded-full px-3 py-0.5 text-sm font-semibold text-white ${
                            paid ? 'bg-[#0f3a52]' : 'bg-gray-500'
                        }`}
                    >
            {o.status}
          </span>
                </p>
                <p className="text-gray-600">Mời tới quầy lấy nước</p>
            </div>
            <Link
                href="/"
                className="mt-6 inline-block rounded bg-[#0f3a52] px-5 py-2 font-semibold text-white hover:bg-[#c4956a]"
            >
                Về trang chủ
            </Link>
        </div>
    );
}