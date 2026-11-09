'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { PromotionItem } from '@/lib/types';

export default function AdminPromotionsTab() {
  const token = useAuth((s) => s.token);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);

  // Form states
  const [code, setCode] = useState('');
  const [percent, setPercent] = useState<number>(10);
  const [minOrderValue, setMinOrderValue] = useState<number>(0);
  const [usageLimit, setUsageLimit] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [active, setActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const { data: promotions, isLoading, refetch } = useQuery({
    queryKey: ['admin-promotions'],
    enabled: !!token,
    queryFn: () => api<PromotionItem[]>('/admin/promotions', { token: token! }),
  });

  const openCreate = () => {
    setEditingCode(null);
    setCode('');
    setPercent(10);
    setMinOrderValue(0);
    setUsageLimit('');
    setStartDate('');
    setEndDate('');
    setActive(true);
    setFormMsg(null);
    setModalOpen(true);
  };

  const openEdit = (promo: PromotionItem) => {
    setEditingCode(promo.code);
    setCode(promo.code);
    setPercent(promo.percent);
    setMinOrderValue(promo.minOrderValue || 0);
    setUsageLimit(promo.usageLimit !== null ? String(promo.usageLimit) : '');
    setStartDate(promo.startDate ? promo.startDate.slice(0, 10) : '');
    setEndDate(promo.endDate ? promo.endDate.slice(0, 10) : '');
    setActive(promo.active);
    setFormMsg(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);

    try {
      if (editingCode) {
        // Cập nhật
        await api(`/admin/promotions/${editingCode}`, {
          method: 'PUT',
          token: token!,
          body: JSON.stringify({
            percent: Number(percent),
            minOrderValue: Number(minOrderValue) || 0,
            usageLimit: usageLimit.trim() ? Number(usageLimit) : null,
            startDate: startDate ? new Date(startDate).toISOString() : null,
            endDate: endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : null,
            active,
          }),
        });
      } else {
        // Tạo mới
        await api('/admin/promotions', {
          method: 'POST',
          token: token!,
          body: JSON.stringify({
            code: code.trim().toUpperCase(),
            percent: Number(percent),
            minOrderValue: Number(minOrderValue) || 0,
            usageLimit: usageLimit.trim() ? Number(usageLimit) : null,
            startDate: startDate ? new Date(startDate).toISOString() : undefined,
            endDate: endDate ? new Date(endDate + 'T23:59:59.999Z').toISOString() : undefined,
            active,
          }),
        });
      }

      await refetch();
      setModalOpen(false);
    } catch (err) {
      setFormMsg({ text: (err as Error).message, isError: true });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (promoCode: string) => {
    if (!confirm(`Bạn có chắc muốn xóa mã khuyến mãi ${promoCode}?`)) return;
    try {
      await api(`/admin/promotions/${promoCode}`, {
        method: 'DELETE',
        token: token!,
      });
      await refetch();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0f3a52]">Danh sách Mã Khuyến Mãi</h2>
        </div>
        <button
          onClick={openCreate}
          className="rounded bg-[#0f3a52] px-4 py-2 text-xs font-bold uppercase text-white shadow hover:bg-[#1a4f6e] transition"
        >
          Tạo mã mới
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Đang tải danh sách khuyến mãi...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-700">
              <tr>
                <th className="p-3">Mã Code</th>
                <th className="p-3">Giảm giá</th>
                <th className="p-3">Đơn tối thiểu</th>
                <th className="p-3">Lượt đã dùng</th>
                <th className="p-3">Thời hạn áp dụng</th>
                <th className="p-3 text-center">Trạng thái</th>
                <th className="p-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {promotions?.map((p) => {
                const now = new Date();
                const isExpired = p.endDate && new Date(p.endDate) < now;
                const isFull = p.usageLimit !== null && p.usedCount >= p.usageLimit;

                return (
                  <tr key={p.code} className="hover:bg-gray-50/50">
                    <td className="p-3 font-mono font-bold text-[#c4956a]">{p.code}</td>
                    <td className="p-3 font-bold text-green-700">{p.percent}%</td>
                    <td className="p-3 text-gray-600">
                      {p.minOrderValue > 0
                        ? `${p.minOrderValue.toLocaleString('vi-VN')}đ`
                        : 'Không giới hạn'}
                    </td>
                    <td className="p-3">
                      <span className="font-semibold text-[#0f3a52]">{p.usedCount}</span>
                      {p.usageLimit !== null ? (
                        <span className="text-xs text-gray-400"> / {p.usageLimit} lượt</span>
                      ) : (
                        <span className="text-xs text-gray-400"> / ∞</span>
                      )}
                    </td>
                    <td className="p-3 text-xs text-gray-600">
                      {p.startDate || p.endDate ? (
                        <span>
                          {p.startDate ? new Date(p.startDate).toLocaleDateString('vi-VN') : 'Từ nay'}{' '}
                          ➔ {p.endDate ? new Date(p.endDate).toLocaleDateString('vi-VN') : 'Vô thời hạn'}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Không giới hạn ngày</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {!p.active ? (
                        <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">
                          Tạm tắt
                        </span>
                      ) : isExpired ? (
                        <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                          Hết hạn
                        </span>
                      ) : isFull ? (
                        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                          Hết lượt
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                          Đang hoạt động
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="mr-2 text-xs font-semibold text-[#0f3a52] hover:underline"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => handleDelete(p.code)}
                        className="text-xs font-semibold text-red-600 hover:underline"
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Thêm / Sửa Voucher */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-[#0f3a52]">
                {editingCode ? `Sửa mã: ${editingCode}` : 'Tạo mã khuyến mãi mới'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Mã Voucher:
                </label>
                <input
                  type="text"
                  disabled={!!editingCode}
                  required
                  placeholder="VD: BANMOI, BREW20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full rounded border border-gray-300 p-2 font-mono uppercase outline-none focus:border-[#c4956a] disabled:bg-gray-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Mức giảm (%):
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={percent}
                    onChange={(e) => setPercent(Number(e.target.value))}
                    className="w-full rounded border border-gray-300 p-2 outline-none focus:border-[#c4956a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Đơn tối thiểu (đ):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="5000"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(Number(e.target.value))}
                    className="w-full rounded border border-gray-300 p-2 outline-none focus:border-[#c4956a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Giới hạn số lượt dùng (bỏ trống nếu vô hạn):
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Không giới hạn"
                  value={usageLimit}
                  onChange={(e) => setUsageLimit(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2 outline-none focus:border-[#c4956a]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Ngày bắt đầu:
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded border border-gray-300 p-2 text-xs outline-none focus:border-[#c4956a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                    Ngày hết hạn:
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full rounded border border-gray-300 p-2 text-xs outline-none focus:border-[#c4956a]"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs font-semibold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="accent-[#0f3a52] h-4 w-4"
                />
                Kích hoạt áp dụng mã ngay
              </label>

              {formMsg && (
                <p
                  className={`rounded p-2 text-xs font-semibold ${
                    formMsg.isError
                      ? 'bg-red-50 text-red-600 border border-red-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  }`}
                >
                  {formMsg.text}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-[#c4956a] px-5 py-2 text-xs font-bold text-white shadow hover:bg-[#a97b52] disabled:opacity-50"
                >
                  {submitting ? 'Đang lưu...' : 'Lưu mã'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

