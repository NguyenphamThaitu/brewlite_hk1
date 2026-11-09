'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import type { AdminProduct } from '@/lib/types';

const PRODUCT_ORDER = [
  'Cà phê sữa',
  'Cà phê đen',
  'Bạc xỉu',
  'Espresso',
  'Americano',
  'Cappuccino',
];

export default function AdminProductsTab() {
  const token = useAuth((s) => s.token);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [price, setPrice] = useState<number>(35000);
  const [category, setCategory] = useState<string>('Cà phê truyền thống');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const { data: products, isLoading, refetch } = useQuery({
    queryKey: ['admin-products'],
    enabled: !!token,
    queryFn: () => api<AdminProduct[]>('/admin/products', { token: token! }),
  });

  const openCreate = () => {
    setEditingProduct(null);
    setName('');
    setPrice(35000);
    setCategory('Cà phê truyền thống');
    setImageUrl('');
    setIsActive(true);
    setFormMsg(null);
    setModalOpen(true);
  };

  const openEdit = (prod: AdminProduct) => {
    setEditingProduct(prod);
    setName(prod.name);
    setPrice(prod.price);
    setCategory(prod.category || 'Cà phê truyền thống');
    setImageUrl(prod.imageUrl);
    setIsActive(prod.isActive);
    setFormMsg(null);
    setModalOpen(true);
  };

  // Xử lý upload ảnh trực tiếp
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      const res = await fetch('http://localhost:3001/admin/products/upload-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Lỗi tải ảnh');
      }
      setImageUrl(data.imageUrl);
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);

    try {
      if (editingProduct) {
        await api(`/admin/products/${editingProduct.id}`, {
          method: 'PUT',
          token: token!,
          body: JSON.stringify({
            name: name.trim(),
            price: Number(price),
            category,
            imageUrl: imageUrl.trim() || undefined,
            isActive,
          }),
        });
      } else {
        await api('/admin/products', {
          method: 'POST',
          token: token!,
          body: JSON.stringify({
            name: name.trim(),
            price: Number(price),
            category,
            imageUrl: imageUrl.trim() || undefined,
            isActive,
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

  const handleToggleActive = async (prod: AdminProduct) => {
    try {
      await api(`/admin/products/${prod.id}`, {
        method: 'PUT',
        token: token!,
        body: JSON.stringify({ isActive: !prod.isActive }),
      });
      await refetch();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const handleDelete = async (prod: AdminProduct) => {
    if (!confirm(`Bạn có chắc muốn xóa món "${prod.name}" không?`)) return;
    try {
      await api(`/admin/products/${prod.id}`, {
        method: 'DELETE',
        token: token!,
      });
      await refetch();
    } catch (err) {
      alert((err as Error).message);
    }
  };

  const sortedProducts = products
    ? [...products].sort((a, b) => {
        const ia = PRODUCT_ORDER.indexOf(a.name);
        const ib = PRODUCT_ORDER.indexOf(b.name);
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.id - b.id;
      })
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-[#0f3a52]">Quản lý Món (CRUD & Upload ảnh)</h2>
        </div>
        <button
          onClick={openCreate}
          className="rounded bg-[#0f3a52] px-4 py-2 text-xs font-bold uppercase text-white shadow hover:bg-[#1a4f6e] transition"
        >
          Thêm món mới
        </button>
      </div>

      {isLoading ? (
        <p className="text-gray-500">Đang tải danh sách đồ uống...</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {sortedProducts.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col justify-between overflow-hidden rounded-lg border bg-white shadow-sm transition ${
                !p.isActive ? 'border-gray-300 opacity-60' : 'border-gray-200'
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-cover object-center"
                />
                {!p.isActive && (
                  <span className="absolute left-2 top-2 rounded bg-gray-800 px-2 py-0.5 text-xs font-bold text-white">
                    Tạm ngừng bán
                  </span>
                )}
              </div>

              <div className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-[#0f3a52] text-base">{p.name}</h3>
                  </div>
                  <span className="font-black text-[#c4956a]">
                    {p.price.toLocaleString('vi-VN')}đ
                  </span>
                </div>

                <div className="flex items-center justify-between border-t pt-3 text-xs">
                  <button
                    onClick={() => handleToggleActive(p)}
                    className={`font-semibold hover:underline ${
                      p.isActive ? 'text-amber-600' : 'text-green-700'
                    }`}
                  >
                    {p.isActive ? 'Ngừng bán' : 'Mở bán lại'}
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEdit(p)}
                      className="rounded bg-gray-100 px-2.5 py-1 font-bold text-[#0f3a52] hover:bg-gray-200 transition"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(p)}
                      className="rounded bg-red-50 px-2.5 py-1 font-bold text-red-600 hover:bg-red-100 transition"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm / Chỉnh sửa món */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-lg font-bold text-[#0f3a52]">
                {editingProduct ? `Sửa món: ${editingProduct.name}` : 'Thêm món mới vào menu'}
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
                  Tên đồ uống:
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Cà phê đen"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2 outline-none focus:border-[#c4956a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Giá bán (Size S - VNĐ):
                </label>
                <input
                  type="number"
                  required
                  min={1000}
                  step={1000}
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full rounded border border-gray-300 p-2 outline-none focus:border-[#c4956a]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                  Hình ảnh món:
                </label>
                
                {/* Nút Upload trực tiếp từ máy */}
                <div className="mb-2">
                  <label className="inline-flex cursor-pointer items-center justify-center rounded bg-gray-100 px-3 py-1.5 text-xs font-bold text-[#0f3a52] hover:bg-gray-200 transition">
                    <span>{uploading ? 'Đang tải ảnh lên...' : 'Chọn ảnh từ máy tính (Upload)'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Hoặc nhập URL */}
                <input
                  type="url"
                  placeholder="Hoặc dán URL ảnh tại đây..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded border border-gray-300 p-2 text-xs outline-none focus:border-[#c4956a]"
                />

                {imageUrl && (
                  <div className="mt-2 flex items-center gap-3 rounded border border-gray-100 p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-12 w-12 rounded object-cover"
                    />
                    <span className="truncate text-xs text-gray-500">{imageUrl}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-[#0f3a52] focus:ring-[#c4956a]"
                />
                <label htmlFor="isActiveCheck" className="text-xs text-gray-700 font-medium">
                  Đang mở bán trên Menu
                </label>
              </div>

              {formMsg && (
                <p className={`text-xs ${formMsg.isError ? 'text-red-600' : 'text-green-600'}`}>
                  {formMsg.text}
                </p>
              )}

              <div className="flex justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded border border-gray-300 px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded bg-[#0f3a52] px-5 py-2 text-xs font-bold uppercase text-white hover:bg-[#1a4f6e]"
                >
                  {submitting ? 'Đang lưu...' : editingProduct ? 'Lưu cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

