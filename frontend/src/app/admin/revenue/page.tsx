'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/store/auth';
import { useHydrated } from '@/lib/useHydrated';
import AdminRevenueTab from './revenue-tab';
import AdminPromotionsTab from './promotions-tab';
import AdminProductsTab from './products-tab';

type Tab = 'revenue' | 'promotions' | 'products';

export default function AdminRevenuePage() {
  const hydrated = useHydrated();
  const router = useRouter();
  const token = useAuth((s) => s.token);
  const user = useAuth((s) => s.user);

  const [activeTab, setActiveTab] = useState<Tab>('revenue');

  if (!hydrated) return null;

  if (!token) {
    return (
      <div className="py-12 text-center">
        <p className="mb-4 text-gray-600">Vui lòng đăng nhập với tài khoản Quản trị viên.</p>
        <button
          onClick={() => router.push('/login')}
          className="rounded bg-[#0f3a52] px-6 py-2 text-white"
        >
          Đăng nhập
        </button>
      </div>
    );
  }

  if (user?.role !== 'ADMIN') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
        <h2 className="text-xl font-bold">Không có quyền truy cập</h2>
        <p className="mt-2 text-sm">
          Trang này chỉ dành cho Quản trị viên (Admin).
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-[#0f3a52]">
          Quản lý Doanh thu & Khuyến mãi
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-gray-200 gap-1">
        <button
          onClick={() => setActiveTab('revenue')}
          className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === 'revenue'
              ? 'border-[#0f3a52] text-[#0f3a52]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Báo cáo doanh thu
        </button>

        <button
          onClick={() => setActiveTab('promotions')}
          className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === 'promotions'
              ? 'border-[#0f3a52] text-[#0f3a52]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Mã khuyến mãi
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition ${
            activeTab === 'products'
              ? 'border-[#0f3a52] text-[#0f3a52]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Thực đơn món
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'revenue' && <AdminRevenueTab />}
      {activeTab === 'promotions' && <AdminPromotionsTab />}
      {activeTab === 'products' && <AdminProductsTab />}
    </div>
  );
}

