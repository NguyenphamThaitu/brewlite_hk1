'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { RevenueReport } from '@/lib/types';

export default function AdminRevenueTab() {
  const token = useAuth((s) => s.token);

  const getVnDate = (d: Date = new Date()) => {
    const vnTime = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return vnTime.toISOString().split('T')[0];
  };

  const todayStr = getVnDate();
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['admin-revenue-report', startDate, endDate],
    enabled: !!token,
    queryFn: () =>
      api<RevenueReport>(`/admin/reports/revenue?startDate=${startDate}&endDate=${endDate}`, {
        token: token!,
      }),
  });

  return (
    <div className="space-y-6">
      {/* Bộ lọc khoảng ngày báo cáo */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase text-gray-700">Từ ngày:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded border border-gray-300 p-2 text-sm font-semibold text-[#0f3a52] outline-none focus:border-[#c4956a]"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold uppercase text-gray-700">Đến ngày:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded border border-gray-300 p-2 text-sm font-semibold text-[#0f3a52] outline-none focus:border-[#c4956a]"
            />
          </div>
        </div>

        <button
          onClick={() => refetch()}
          className="rounded bg-[#0f3a52] px-4 py-2 text-xs font-bold uppercase text-white hover:bg-[#1a4f6e] transition"
        >
          Làm mới dữ liệu
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Đang tải báo cáo doanh thu...</p>
      ) : error ? (
        <p className="text-red-600 font-semibold">Lỗi: {(error as Error).message}</p>
      ) : data ? (
        <div className="space-y-6">
          {/* 4 Thẻ KPI */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Tổng doanh thu thực tế
              </span>
              <p className="mt-2 text-2xl font-black text-green-700">
                {data.summary.totalRevenue.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Tổng đơn theo bộ lọc
              </span>
              <p className="mt-2 text-2xl font-black text-[#0f3a52]">
                {data.summary.successfulOrders}{' '}
                <span className="text-sm font-normal text-gray-500">
                  / {data.summary.totalOrders} đơn
                </span>
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Đơn bị hủy: <span className="font-semibold text-red-600">{data.summary.cancelledOrders}</span>
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Giá trị đơn trung bình (AOV)
              </span>
              <p className="mt-2 text-2xl font-black text-[#c4956a]">
                {data.summary.averageOrderValue.toLocaleString('vi-VN')}đ
              </p>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Tỷ lệ hoàn tất đơn
              </span>
              <p className="mt-2 text-2xl font-black text-blue-700">
                {data.summary.totalOrders > 0
                  ? Math.round(
                      (data.summary.successfulOrders / data.summary.totalOrders) * 100,
                    )
                  : 100}
                %
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Top món bán chạy */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <h3 className="border-b pb-3 text-base font-bold uppercase tracking-wide text-[#0f3a52]">
                Top món bán chạy trong kỳ
              </h3>
              {data.topSellingProducts.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400 italic">
                  Chưa có món nào bán ra trong khoảng thời gian này.
                </p>
              ) : (
                <div className="mt-3 divide-y">
                  {data.topSellingProducts.map((p, idx) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-[#0f3a52]">
                          #{idx + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-gray-800">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            Đã bán: <strong>{p.totalQty}</strong> ly
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-[#c4956a]">
                        {p.totalSales.toLocaleString('vi-VN')}đ
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Đơn hàng gần đây trong kỳ */}
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between border-b pb-3">
                <h3 className="text-base font-bold uppercase tracking-wide text-[#0f3a52]">
                  Đơn hàng thành công
                </h3>
                <span className="rounded bg-blue-50 px-2.5 py-1 text-xs font-bold text-[#0f3a52] border border-blue-200">
                  Tổng: {data.summary.successfulOrders} đơn
                </span>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="py-6 text-center text-sm text-gray-400 italic">
                  Không có đơn hàng thành công trong khoảng thời gian này.
                </p>
              ) : (
                <div className="mt-3 divide-y max-h-[480px] overflow-y-auto pr-1">
                  {data.recentOrders.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                      <div>
                        <span className="font-mono font-bold text-[#0f3a52]">
                          #{o.id}
                        </span>{' '}
                        <span className="text-xs text-gray-500">
                          ({o.itemCount} món{o.promoCode ? ` • Mã: ${o.promoCode}` : ''})
                        </span>
                        <div className="text-xs text-gray-400">
                          {new Date(o.createdAt).toLocaleDateString('vi-VN')}{' '}
                          {new Date(o.createdAt).toLocaleTimeString('vi-VN')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-700">
                          {o.total.toLocaleString('vi-VN')}đ
                        </div>
                        {o.discount > 0 && (
                          <div className="text-xs text-gray-500">
                            <span className="text-gray-400 mr-1">Gốc:</span>
                            <span className="line-through text-gray-400">
                              {(o.originalTotal ?? (o.total + o.discount)).toLocaleString('vi-VN')}đ
                            </span>
                            <span className="ml-1 text-red-600 font-semibold">
                              (-{o.discount.toLocaleString('vi-VN')}đ)
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
