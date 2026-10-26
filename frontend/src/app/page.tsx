'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api, vnd } from '@/lib/api';
import type { Product } from '@/lib/types';

export default function MenuPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => api<Product[]>('/products'),
  });

  if (isLoading) return <p>Đang tải menu...</p>;
  if (error) return <p className="text-red-600">Lỗi: {(error as Error).message}</p>;
  if (!data?.length) return <p>Chưa có sản phẩm nào.</p>;

  return (
      <div>
        <h1 className="mb-4 border-b border-gray-300 pb-3 text-center text-2xl font-semibold uppercase tracking-wide">
          Menu
        </h1>
        <div className="grid grid-cols-2 gap-5 md:grid-cols-3">
          {data.map((p) => (
              <Link
                  key={p.id}
                  href={`/products/${p.id}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.imageUrl} alt={p.name} className="h-44 w-full object-cover transition group-hover:scale-105" />
                <div className="p-3">
                  <div className="font-semibold uppercase group-hover:text-[#c4956a]">{p.name}</div>
                  <div className="font-semibold text-[#c4956a]">{vnd(p.price)}</div>
                </div>
              </Link>
          ))}
        </div>
      </div>
  );
}