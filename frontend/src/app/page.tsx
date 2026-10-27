
'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, vnd } from '@/lib/api';
import type { Product } from '@/lib/types';

export default function MenuPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => api<Product[]>('/products'),
  });

  if (isLoading) return <p>Đang tải menu...</p>;

  if (error) {
    return (
      <p className="text-red-600">
        Lỗi: {(error as Error).message}
      </p>
    );
  }

  if (!data?.length) {
    return <p>Chưa có sản phẩm nào.</p>;
  }

  // Locally filter product names in the browser.
  // No additional API request is needed when searching.
  // Chuan hoa chuoi: bo dau tieng Viet, khong phan biet hoa/thuong
const normalizeText = (text: string): string => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
};

// Loc mon an ngay tren frontend
const normalizedSearch = normalizeText(searchTerm);

const filteredProducts = data.filter((product) =>
  normalizeText(product.name).includes(normalizedSearch),
);

  return (
    <div>
      <h1 className="mb-4 border-b border-gray-300 pb-3 text-center text-2xl font-semibold uppercase tracking-wide">
        Menu
      </h1>

      {/* Menu search */}
      <div className="mb-5">
        <label
          htmlFor="menu-search"
          className="mb-2 block font-medium"
        >
          Tìm món theo tên
        </label>

        <input
          id="menu-search"
          type="search"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Nhập tên đồ uống..."
          className="w-full rounded-lg border border-gray-300 px-4 py-2 outline-none focus:border-[#c4956a] focus:ring-1 focus:ring-[#c4956a]"
        />
      </div>

      {/* Search results */}
      {filteredProducts.length === 0 ? (
        <p className="py-6 text-center text-gray-500">
          Không tìm thấy món nào phù hợp với “{searchTerm}”.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
          {filteredProducts.map((p) => (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="aspect-square w-full overflow-hidden bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-cover object-center transition duration-300 group-hover:scale-105"
                />
              </div>

              <div className="flex flex-1 flex-col justify-between p-3">
                <div className="font-semibold uppercase group-hover:text-[#c4956a]">
                  {p.name}
                </div>

                <div className="font-semibold text-[#c4956a]">
                  {vnd(p.price)}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
