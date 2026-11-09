'use client';
import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/store/auth';
import { useHydrated } from '@/lib/useHydrated';
import type {
    AllRecipes,
    DailyReport,
    Ingredient,
} from '@/lib/types';

type Tab = 'inventory' | 'report' | 'recipes';

export default function AdminInventoryPage() {
    const hydrated = useHydrated();
    const router = useRouter();
    const token = useAuth((s) => s.token);
    const user = useAuth((s) => s.user);

    const [activeTab, setActiveTab] = useState<Tab>('inventory');

    // State cho Thêm nguyên liệu mới (Create Ingredient)
    const [createIngModal, setCreateIngModal] = useState(false);
    const [newIngName, setNewIngName] = useState('');
    const [newIngUnit, setNewIngUnit] = useState('g');
    const [newIngInitialStock, setNewIngInitialStock] = useState<number>(1000);
    const [newIngThreshold, setNewIngThreshold] = useState<number>(200);
    const [createIngLoading, setCreateIngLoading] = useState(false);
    const [createIngMsg, setCreateIngMsg] = useState<{ text: string; isError?: boolean } | null>(null);

    // State cho Nhập kho (Stock In)
    const [stockInModal, setStockInModal] = useState(false);
    const [stockInIngredientId, setStockInIngredientId] = useState<number>(1);
    const [stockInQty, setStockInQty] = useState<number>(1000);
    const [stockInReason, setStockInReason] = useState<string>('');
    const [stockInLoading, setStockInLoading] = useState(false);
    const [stockInMsg, setStockInMsg] = useState<{ text: string; isError?: boolean } | null>(null);

    // State cho Điều chỉnh kiểm kê (Adjustment)
    const [adjustModal, setAdjustModal] = useState(false);
    const [adjustIngredientId, setAdjustIngredientId] = useState<number>(1);
    const [adjustActualStock, setAdjustActualStock] = useState<number>(0);
    const [adjustReason, setAdjustReason] = useState<string>('');
    const [adjustLoading, setAdjustLoading] = useState(false);
    const [adjustMsg, setAdjustMsg] = useState<{ text: string; isError?: boolean } | null>(null);

    // State cho Chỉnh sửa công thức (Recipe Edit)
    interface EditRecipeItem {
        ingredientId: number;
        amount: number;
    }

    const queryClient = useQueryClient();
    const [editRecipeModal, setEditRecipeModal] = useState(false);
    const [selectedTargetKey, setSelectedTargetKey] = useState<string>('');
    const [selectedSize, setSelectedSize] = useState<string>('M');
    const [editItems, setEditItems] = useState<EditRecipeItem[]>([]);
    const [editLoading, setEditLoading] = useState(false);
    const [editMsg, setEditMsg] = useState<{ text: string; isError?: boolean } | null>(null);

    // State cho Báo cáo ngày
    const [reportDate, setReportDate] = useState(() => {
        const now = new Date();
        const vnTime = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        return vnTime.toISOString().split('T')[0];
    });

    // 1. Tải danh sách nguyên liệu
    const {
        data: ingredients,
        isLoading: loadingIngredients,
        refetch: refetchIngredients,
    } = useQuery({
        queryKey: ['admin-ingredients'],
        enabled: !!token && user?.role === 'ADMIN',
        queryFn: () => api<Ingredient[]>('/inventory/ingredients', { token: token! }),
    });

    // 2. Tải báo cáo ngày
    const {
        data: dailyReport,
        isLoading: loadingReport,
    } = useQuery({
        queryKey: ['admin-daily-report', reportDate],
        enabled: !!token && user?.role === 'ADMIN' && activeTab === 'report',
        queryFn: () =>
            api<DailyReport>(`/inventory/reports/daily?date=${reportDate}`, {
                token: token!,
            }),
    });

    // 3. Tải công thức món và topping
    const {
        data: allRecipes,
        isLoading: loadingRecipes,
        refetch: refetchRecipes,
    } = useQuery({
        queryKey: ['admin-recipes'],
        enabled: !!token && user?.role === 'ADMIN',
        queryFn: () => api<AllRecipes>('/inventory/recipes', { token: token! }),
    });

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
                    Trang này chỉ dành cho Quản trị viên (Admin). Tài khoản hiện tại có vai trò{' '}
                    <strong>{user?.role ?? 'CUSTOMER'}</strong>.
                </p>
                <p className="mt-1 text-xs text-gray-500">
                    Gợi ý đăng nhập tài khoản demo Admin: <code>admin@brewlite.vn</code> / <code>admin123</code>
                </p>
            </div>
        );
    }

    // Xử lý nộp form Thêm nguyên liệu mới
    async function handleCreateIngredient(e: React.FormEvent) {
        e.preventDefault();
        setCreateIngLoading(true);
        setCreateIngMsg(null);
        try {
            await api('/inventory/ingredients', {
                method: 'POST',
                token: token!,
                body: JSON.stringify({
                    name: newIngName.trim(),
                    unit: newIngUnit.trim(),
                    initialStock: Number(newIngInitialStock),
                    lowStockThreshold: Number(newIngThreshold),
                }),
            });
            setCreateIngMsg({ text: 'Thêm nguyên liệu mới vào kho thành công!' });
            await refetchIngredients();
            setTimeout(() => {
                setCreateIngModal(false);
                setCreateIngMsg(null);
                setNewIngName('');
                setNewIngInitialStock(1000);
                setNewIngThreshold(200);
            }, 1000);
        } catch (err) {
            setCreateIngMsg({ text: (err as Error).message, isError: true });
        } finally {
            setCreateIngLoading(false);
        }
    }

    // Xử lý Xóa nguyên liệu khỏi kho
    async function handleDeleteIngredient(id: number, name: string) {
        if (!confirm(`Bạn có chắc muốn xóa nguyên liệu "${name}" khỏi kho không?`)) return;
        try {
            await api(`/inventory/ingredients/${id}`, {
                method: 'DELETE',
                token: token!,
            });
            await refetchIngredients();
        } catch (err) {
            alert((err as Error).message);
        }
    }

    // Xử lý nộp form Nhập kho
    async function handleStockIn(e: React.FormEvent) {
        e.preventDefault();
        setStockInLoading(true);
        setStockInMsg(null);
        try {
            await api('/inventory/stock-in', {
                method: 'POST',
                token: token!,
                body: JSON.stringify({
                    ingredientId: Number(stockInIngredientId),
                    quantity: Number(stockInQty),
                    reason: stockInReason || undefined,
                }),
            });
            setStockInMsg({ text: 'Nhập kho thành công!' });
            await refetchIngredients();
            setTimeout(() => {
                setStockInModal(false);
                setStockInMsg(null);
            }, 1200);
        } catch (err) {
            setStockInMsg({ text: (err as Error).message, isError: true });
        } finally {
            setStockInLoading(false);
        }
    }

    // Xử lý nộp form Kiểm kê
    async function handleAdjust(e: React.FormEvent) {
        e.preventDefault();
        setAdjustLoading(true);
        setAdjustMsg(null);
        try {
            await api('/inventory/adjust', {
                method: 'POST',
                token: token!,
                body: JSON.stringify({
                    ingredientId: Number(adjustIngredientId),
                    actualStock: Number(adjustActualStock),
                    reason: adjustReason,
                }),
            });
            setAdjustMsg({ text: 'Điều chỉnh kiểm kê thành công!' });
            await refetchIngredients();
            setTimeout(() => {
                setAdjustModal(false);
                setAdjustMsg(null);
            }, 1200);
        } catch (err) {
            setAdjustMsg({ text: (err as Error).message, isError: true });
        } finally {
            setAdjustLoading(false);
        }
    }

    // Tải công thức của món / topping được chọn vào form sửa
    function loadRecipeForSelection(targetKey: string, size: string) {
        if (targetKey.startsWith('prod-')) {
            const prodId = Number(targetKey.replace('prod-', ''));
            const prod = allRecipes?.products.find((p) => p.id === prodId);
            if (prod) {
                const items = prod.recipes.filter((r) => r.size === size);
                setEditItems(
                    items.length > 0
                        ? items.map((it) => ({ ingredientId: it.ingredientId, amount: it.amount }))
                        : [{ ingredientId: ingredients?.[0]?.id || 1, amount: 10 }],
                );
            }
        } else if (targetKey.startsWith('top-')) {
            const toppingName = targetKey.replace('top-', '');
            const topItems = allRecipes?.toppings.filter((t) => t.toppingName === toppingName) || [];
            setEditItems(
                topItems.length > 0
                    ? topItems.map((it) => ({ ingredientId: it.ingredientId, amount: it.amount }))
                    : [{ ingredientId: ingredients?.[0]?.id || 1, amount: 20 }],
            );
        }
    }

    // Mở modal sửa công thức tập trung
    function openEditRecipeModal() {
        const firstProd = allRecipes?.products?.[0];
        const initialKey = firstProd ? `prod-${firstProd.id}` : 'prod-1';
        const initialSize = 'M';
        setSelectedTargetKey(initialKey);
        setSelectedSize(initialSize);
        loadRecipeForSelection(initialKey, initialSize);
        setEditMsg(null);
        setEditRecipeModal(true);
    }

    function handleTargetChange(key: string) {
        setSelectedTargetKey(key);
        setEditMsg(null);
        loadRecipeForSelection(key, selectedSize);
    }

    function handleSizeChange(sz: string) {
        setSelectedSize(sz);
        setEditMsg(null);
        loadRecipeForSelection(selectedTargetKey, sz);
    }

    function handleAddIngredientRow() {
        if (!ingredients || ingredients.length === 0) return;
        const usedIds = new Set(editItems.map((i) => i.ingredientId));
        const unused = ingredients.find((i) => !usedIds.has(i.id)) || ingredients[0];
        setEditItems([...editItems, { ingredientId: unused.id, amount: 10 }]);
    }

    function handleRemoveIngredientRow(index: number) {
        if (editItems.length <= 1) return;
        setEditItems(editItems.filter((_, idx) => idx !== index));
    }

    function handleUpdateItem(index: number, field: 'ingredientId' | 'amount', value: number) {
        setEditItems(
            editItems.map((it, idx) => (idx === index ? { ...it, [field]: value } : it)),
        );
    }

    async function handleSaveRecipe(e: React.FormEvent) {
        e.preventDefault();
        setEditLoading(true);
        setEditMsg(null);

        try {
            if (selectedTargetKey.startsWith('prod-')) {
                const productId = Number(selectedTargetKey.replace('prod-', ''));
                await api('/inventory/recipes/product', {
                    method: 'PUT',
                    token: token!,
                    body: JSON.stringify({
                        productId,
                        size: selectedSize,
                        ingredients: editItems.map((it) => ({
                            ingredientId: Number(it.ingredientId),
                            amount: Number(it.amount),
                        })),
                    }),
                });
            } else if (selectedTargetKey.startsWith('top-')) {
                const toppingName = selectedTargetKey.replace('top-', '');
                await api('/inventory/recipes/topping', {
                    method: 'PUT',
                    token: token!,
                    body: JSON.stringify({
                        toppingName,
                        ingredients: editItems.map((it) => ({
                            ingredientId: Number(it.ingredientId),
                            amount: Number(it.amount),
                        })),
                    }),
                });
            }

            setEditMsg({ text: 'Cập nhật công thức thành công!' });
            await queryClient.invalidateQueries({ queryKey: ['admin-recipes'] });
            await refetchRecipes();
            setTimeout(() => {
                setEditRecipeModal(false);
                setEditMsg(null);
            }, 1000);
        } catch (err) {
            setEditMsg({ text: (err as Error).message, isError: true });
        } finally {
            setEditLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Header & Thanh nút thao tác */}
            <div className="flex flex-wrap items-center justify-between border-b border-gray-200 pb-4 gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-[#0f3a52]">
                        Hệ thống Quản lý Kho & Định lượng
                    </h1>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={() => {
                            setCreateIngModal(true);
                            setCreateIngMsg(null);
                        }}
                        className="rounded bg-[#0f3a52] px-3.5 py-2 text-xs font-bold uppercase text-white hover:bg-[#1a4f6e] transition"
                    >
                        Thêm nguyên liệu
                    </button>
                    <button
                        onClick={() => {
                            setStockInModal(true);
                            setStockInMsg(null);
                        }}
                        className="rounded bg-[#0f3a52] px-3.5 py-2 text-xs font-bold uppercase text-white hover:bg-[#1a4f6e] transition"
                    >
                        Nhập kho
                    </button>
                    <button
                        onClick={() => {
                            setAdjustModal(true);
                            setAdjustMsg(null);
                        }}
                        className="rounded bg-[#c4956a] px-3.5 py-2 text-xs font-bold uppercase text-white hover:bg-[#a97b52] transition"
                    >
                        Kiểm kê điều chỉnh
                    </button>
                </div>
            </div>

            {/* Navigation Tabs (No emojis) */}
            <div className="flex flex-wrap border-b border-gray-200 gap-1">
                <button
                    onClick={() => setActiveTab('inventory')}
                    className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition ${activeTab === 'inventory'
                        ? 'border-[#0f3a52] text-[#0f3a52]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Kho nguyên liệu ({ingredients?.length ?? 0})
                </button>

                <button
                    onClick={() => setActiveTab('report')}
                    className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition ${activeTab === 'report'
                        ? 'border-[#0f3a52] text-[#0f3a52]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Báo cáo xuất - nhập - tồn
                </button>

                <button
                    onClick={() => setActiveTab('recipes')}
                    className={`border-b-2 px-5 py-2.5 text-sm font-semibold transition ${activeTab === 'recipes'
                        ? 'border-[#0f3a52] text-[#0f3a52]'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Công thức pha chế
                </button>
            </div>

            {/* TAB 1: KHO NGUYÊN LIỆU */}
            {activeTab === 'inventory' && (
                <div className="space-y-4">
                    {loadingIngredients ? (
                        <p className="text-gray-500">Đang tải danh sách nguyên liệu...</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-700">
                                    <tr>
                                        <th className="p-3 text-center w-16">STT</th>
                                        <th className="p-3">Nguyên liệu</th>
                                        <th className="p-3">Đơn vị</th>
                                        <th className="p-3 text-right">Tồn thực tế</th>
                                        <th className="p-3 text-right">Đang giữ chỗ</th>
                                        <th className="p-3 text-right">Khả dụng</th>
                                        <th className="p-3 text-right">Ngưỡng cảnh báo</th>
                                        <th className="p-3 text-center">Trạng thái</th>
                                        <th className="p-3 text-center w-20">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {ingredients?.map((ing, idx) => (
                                        <tr key={ing.id} className="hover:bg-gray-50/50">
                                            <td className="p-3 text-center font-mono text-xs text-gray-500">{idx + 1}</td>
                                            <td className="p-3 font-semibold text-[#0f3a52]">{ing.name}</td>
                                            <td className="p-3 font-mono text-xs text-gray-600">{ing.unit}</td>
                                            <td className="p-3 text-right font-medium">{ing.stock.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right text-amber-600">{ing.reservedQty.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right font-bold text-green-700">{ing.availableQty.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right text-gray-400">{ing.lowStockThreshold.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-center">
                                                {ing.isLowStock ? (
                                                    <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                                                        Sắp hết hàng
                                                    </span>
                                                ) : (
                                                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                                                        Bình thường
                                                    </span>
                                                )}
                                            </td>
                                            <td className="p-3 text-center">
                                                <button
                                                    onClick={() => handleDeleteIngredient(ing.id, ing.name)}
                                                    className="rounded px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 hover:text-red-800 transition"
                                                >
                                                    Xóa
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: BÁO CÁO NGÀY */}
            {activeTab === 'report' && (
                <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
                        <div className="flex items-center gap-2">
                            <label className="text-xs font-bold uppercase text-gray-700">Chọn ngày báo cáo:</label>
                            <input
                                type="date"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                                className="rounded border border-gray-300 p-1.5 text-sm font-semibold text-[#0f3a52] outline-none"
                            />
                        </div>
                    </div>

                    {loadingReport ? (
                        <p className="text-gray-500">Đang tải báo cáo ngày...</p>
                    ) : (
                        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-gray-50 text-xs font-semibold uppercase text-gray-700">
                                    <tr>
                                        <th className="p-3">Nguyên liệu</th>
                                        <th className="p-3">Đơn vị</th>
                                        <th className="p-3 text-right">Tồn đầu ngày</th>
                                        <th className="p-3 text-right">Nhập trong ngày</th>
                                        <th className="p-3 text-right">Xuất tiêu hao</th>
                                        <th className="p-3 text-right">Điều chỉnh (±)</th>
                                        <th className="p-3 text-right">Tồn cuối ngày</th>
                                        <th className="p-3 text-right">Đang giữ chỗ</th>
                                        <th className="p-3 text-right">Khả dụng</th>
                                        <th className="p-3 text-center">Đối soát</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {dailyReport?.rows.map((r) => (
                                        <tr key={r.ingredientId} className="hover:bg-gray-50/50">
                                            <td className="p-3 font-semibold text-[#0f3a52]">{r.ingredientName}</td>
                                            <td className="p-3 font-mono text-xs text-gray-500">{r.unit}</td>
                                            <td className="p-3 text-right font-medium">{r.openingBalance.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right text-green-600">+{r.receipts.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right text-red-600">-{r.consumption.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right text-blue-600">
                                                {r.adjustments > 0 ? `+${r.adjustments.toLocaleString('vi-VN')}` : r.adjustments.toLocaleString('vi-VN')}
                                            </td>
                                            <td className="p-3 text-right font-bold text-[#0f3a52]">{r.closingBalance.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right text-amber-600">{r.currentReserved.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-right font-bold text-green-700">{r.currentAvailable.toLocaleString('vi-VN')}</td>
                                            <td className="p-3 text-center">
                                                <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                                                    Khớp 100%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: QUẢN LÝ CÔNG THỨC */}
            {activeTab === 'recipes' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-[#0f3a52]">Định lượng Công thức</h2>
                        </div>
                        <button
                            onClick={openEditRecipeModal}
                            className="rounded bg-[#0f3a52] px-4 py-2 text-xs font-bold uppercase text-white shadow hover:bg-[#1a4f6e] transition"
                        >
                            Chỉnh sửa công thức
                        </button>
                    </div>

                    {loadingRecipes ? (
                        <p className="text-gray-500">Đang tải công thức...</p>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Công thức đồ uống */}
                            {allRecipes?.products.map((prod) => (
                                <div key={prod.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                                    <h3 className="text-base font-bold uppercase tracking-wide text-[#0f3a52] border-b pb-2">
                                        {prod.name}
                                    </h3>
                                    <div className="space-y-2">
                                        {['S', 'M', 'L'].map((sz) => {
                                            const items = prod.recipes.filter((r) => r.size === sz);
                                            return (
                                                <div key={sz} className="rounded border border-gray-100 bg-gray-50/60 p-2.5 text-xs">
                                                    <span className="font-bold text-[#c4956a] uppercase">Size {sz}:</span>
                                                    <div className="mt-1 flex flex-wrap gap-2 text-gray-700">
                                                        {items.map((it) => (
                                                            <span key={it.id} className="rounded bg-white border border-gray-200 px-2 py-0.5 font-medium">
                                                                {it.ingredientName}: <strong>{it.amount} {it.unit}</strong>
                                                            </span>
                                                        ))}
                                                        {items.length === 0 && (
                                                            <span className="text-gray-400 italic">Chưa thiết lập định lượng</span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}

                            {/* Toppings */}
                            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3 md:col-span-2">
                                <h3 className="text-base font-bold uppercase tracking-wide text-[#0f3a52] border-b pb-2">
                                    Công thức Topping
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {allRecipes?.toppings.map((top) => (
                                        <div key={top.id} className="rounded border border-gray-100 bg-gray-50/60 p-2.5 text-xs flex justify-between items-center">
                                            <span className="font-bold text-[#0f3a52] text-sm">{top.toppingName}</span>
                                            <span className="rounded bg-white border border-gray-200 px-2.5 py-1 text-gray-700 font-semibold">
                                                {top.ingredientName}: <strong>{top.amount} {top.unit}</strong>
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL: THÊM NGUYÊN LIỆU MỚI */}
            {createIngModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-bold text-[#0f3a52]">Thêm nguyên liệu mới vào kho</h3>
                            <button onClick={() => setCreateIngModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateIngredient} className="space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                    Tên nguyên liệu (*):
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="VD: Bột Matcha, Siro Bạc Hà, Trà Oolong"
                                    value={newIngName}
                                    onChange={(e) => setNewIngName(e.target.value)}
                                    className="w-full rounded border border-gray-300 p-2 outline-none focus:border-[#c4956a]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                    Đơn vị tính:
                                </label>
                                <select
                                    value={newIngUnit}
                                    onChange={(e) => setNewIngUnit(e.target.value)}
                                    className="w-full rounded border border-gray-300 p-2 outline-none focus:border-[#c4956a]"
                                >
                                    <option value="g">Gram (g)</option>
                                    <option value="ml">Mililit (ml)</option>
                                    <option value="pcs">Cái / Ly / Nắp (pcs)</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                        Tồn kho ban đầu:
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        required
                                        value={newIngInitialStock}
                                        onChange={(e) => setNewIngInitialStock(Number(e.target.value))}
                                        className="w-full rounded border border-gray-300 p-2 outline-none font-mono focus:border-[#c4956a]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                        Ngưỡng cảnh báo:
                                    </label>
                                    <input
                                        type="number"
                                        min={0}
                                        step="any"
                                        required
                                        value={newIngThreshold}
                                        onChange={(e) => setNewIngThreshold(Number(e.target.value))}
                                        className="w-full rounded border border-gray-300 p-2 outline-none font-mono focus:border-[#c4956a]"
                                    />
                                </div>
                            </div>

                            {createIngMsg && (
                                <p className={`text-xs font-semibold ${createIngMsg.isError ? 'text-red-600' : 'text-green-600'}`}>
                                    {createIngMsg.text}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => setCreateIngModal(false)}
                                    className="rounded border px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={createIngLoading}
                                    className="rounded bg-[#0f3a52] px-4 py-2 text-xs font-bold text-white hover:bg-[#1a4f6e] disabled:opacity-50 transition"
                                >
                                    {createIngLoading ? 'Đang lưu...' : 'Thêm nguyên liệu'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: NHẬP KHO */}
            {stockInModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-bold text-[#0f3a52]">Nhập kho nguyên liệu</h3>
                            <button onClick={() => setStockInModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleStockIn} className="space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                    Chọn nguyên liệu:
                                </label>
                                <select
                                    value={stockInIngredientId}
                                    onChange={(e) => setStockInIngredientId(Number(e.target.value))}
                                    className="w-full rounded border border-gray-300 p-2 outline-none"
                                >
                                    {ingredients?.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.name} ({i.unit}) - Tồn: {i.stock}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                    Số lượng nhập thêm:
                                </label>
                                <input
                                    type="number"
                                    min={0.01}
                                    step="any"
                                    required
                                    value={stockInQty}
                                    onChange={(e) => setStockInQty(Number(e.target.value))}
                                    className="w-full rounded border border-gray-300 p-2 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                    Lý do / Số hóa đơn / Ghi chú:
                                </label>
                                <input
                                    type="text"
                                    value={stockInReason}
                                    onChange={(e) => setStockInReason(e.target.value)}
                                    placeholder="Nhập bổ sung định kỳ"
                                    className="w-full rounded border border-gray-300 p-2 outline-none"
                                />
                            </div>
                            {stockInMsg && (
                                <p className={`text-xs font-semibold ${stockInMsg.isError ? 'text-red-600' : 'text-green-600'}`}>
                                    {stockInMsg.text}
                                </p>
                            )}
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => setStockInModal(false)}
                                    className="rounded border px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={stockInLoading}
                                    className="rounded bg-[#0f3a52] px-4 py-2 text-xs font-bold text-white hover:bg-[#1a4f6e] disabled:opacity-50 transition"
                                >
                                    {stockInLoading ? 'Đang lưu...' : 'Xác nhận nhập kho'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: ĐIỀU CHỈNH KIỂM KÊ */}
            {adjustModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="text-lg font-bold text-[#0f3a52]">Kiểm kê & Điều chỉnh số dư</h3>
                            <button onClick={() => setAdjustModal(false)} className="text-gray-400 hover:text-gray-600">
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleAdjust} className="space-y-3 text-sm">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                    Nguyên liệu điều chỉnh:
                                </label>
                                <select
                                    value={adjustIngredientId}
                                    onChange={(e) => setAdjustIngredientId(Number(e.target.value))}
                                    className="w-full rounded border border-gray-300 p-2 outline-none"
                                >
                                    {ingredients?.map((i) => (
                                        <option key={i.id} value={i.id}>
                                            {i.name} ({i.unit}) - Hiện tại: {i.stock}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                    Tồn thực tế sau kiểm kê:
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    step="any"
                                    required
                                    value={adjustActualStock}
                                    onChange={(e) => setAdjustActualStock(Number(e.target.value))}
                                    className="w-full rounded border border-gray-300 p-2 outline-none font-mono"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                    Giải trình lý do điều chỉnh (* bắt buộc):
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="Hao hụt tự nhiên khi pha chế / Đổ vỡ"
                                    className="w-full rounded border border-gray-300 p-2 outline-none"
                                />
                            </div>
                            {adjustMsg && (
                                <p className={`text-xs font-semibold ${adjustMsg.isError ? 'text-red-600' : 'text-green-600'}`}>
                                    {adjustMsg.text}
                                </p>
                            )}
                            <div className="flex justify-end gap-2 pt-2 border-t">
                                <button
                                    type="button"
                                    onClick={() => setAdjustModal(false)}
                                    className="rounded border px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={adjustLoading}
                                    className="rounded bg-[#c4956a] px-4 py-2 text-xs font-bold text-white hover:bg-[#a97b52] disabled:opacity-50 transition"
                                >
                                    {adjustLoading ? 'Đang lưu...' : 'Lưu điều chỉnh'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL: CHỈNH SỬA CÔNG THỨC TẬP TRUNG */}
            {editRecipeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-[#0f3a52]">
                                    Chỉnh sửa công thức định lượng
                                </h3>
                            </div>
                            <button
                                onClick={() => {
                                    setEditRecipeModal(false);
                                    setEditMsg(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-lg font-bold px-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* BỘ CHỌN MÓN VÀ KÍCH THƯỚC */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                            <div>
                                <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                    Chọn món / Topping:
                                </label>
                                <select
                                    value={selectedTargetKey}
                                    onChange={(e) => handleTargetChange(e.target.value)}
                                    className="w-full rounded border border-gray-300 bg-white p-2 text-xs font-bold text-[#0f3a52] outline-none"
                                >
                                    <optgroup label="Đồ uống">
                                        {allRecipes?.products.map((p) => (
                                            <option key={p.id} value={`prod-${p.id}`}>
                                                {p.name}
                                            </option>
                                        ))}
                                    </optgroup>
                                    <optgroup label="Topping">
                                        {allRecipes?.toppings.map((t) => (
                                            <option key={t.toppingName} value={`top-${t.toppingName}`}>
                                                Topping {t.toppingName}
                                            </option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            {selectedTargetKey.startsWith('prod-') && (
                                <div>
                                    <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">
                                        Chọn kích cỡ:
                                    </label>
                                    <div className="flex gap-2">
                                        {['S', 'M', 'L'].map((sz) => (
                                            <button
                                                key={sz}
                                                type="button"
                                                onClick={() => handleSizeChange(sz)}
                                                className={`flex-1 rounded py-2 text-xs font-bold transition border ${selectedSize === sz
                                                    ? 'bg-[#0f3a52] text-white border-[#0f3a52] shadow'
                                                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#c4956a]'
                                                    }`}
                                            >
                                                Size {sz}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <form onSubmit={handleSaveRecipe} className="space-y-4 text-sm">
                            <div className="space-y-2.5 max-h-[45vh] overflow-y-auto pr-1">
                                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600">
                                    Thành phần nguyên liệu và định lượng:
                                </label>

                                {editItems.map((item, idx) => {
                                    const selectedIng = ingredients?.find((i) => i.id === item.ingredientId);
                                    return (
                                        <div key={idx} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50/70 p-2.5">
                                            {/* Dropdown chọn nguyên liệu */}
                                            <div className="flex-1">
                                                <select
                                                    value={item.ingredientId}
                                                    onChange={(e) => handleUpdateItem(idx, 'ingredientId', Number(e.target.value))}
                                                    className="w-full rounded border border-gray-300 bg-white p-1.5 text-xs font-semibold text-[#0f3a52] outline-none"
                                                >
                                                    {ingredients?.map((ing) => (
                                                        <option key={ing.id} value={ing.id}>
                                                            {ing.name} ({ing.unit})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Định lượng */}
                                            <div className="w-24">
                                                <input
                                                    type="number"
                                                    min={0.01}
                                                    step="any"
                                                    required
                                                    value={item.amount}
                                                    onChange={(e) => handleUpdateItem(idx, 'amount', Number(e.target.value))}
                                                    className="w-full rounded border border-gray-300 bg-white p-1.5 text-right font-mono text-xs font-semibold outline-none"
                                                />
                                            </div>

                                            {/* Đơn vị */}
                                            <div className="w-12 text-center text-xs font-bold text-gray-500">
                                                {selectedIng?.unit || ''}
                                            </div>

                                            {/* Nút xóa nguyên liệu */}
                                            <button
                                                type="button"
                                                disabled={editItems.length <= 1}
                                                onClick={() => handleRemoveIngredientRow(idx)}
                                                className="rounded px-2 py-1 text-xs text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-20 transition"
                                                title="Xóa nguyên liệu này khỏi công thức"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    );
                                })}

                                <button
                                    type="button"
                                    onClick={handleAddIngredientRow}
                                    className="inline-flex items-center gap-1.5 rounded border border-dashed border-gray-300 px-3 py-1.5 text-xs font-bold text-[#0f3a52] hover:border-[#c4956a] hover:bg-orange-50/50 hover:text-[#c4956a] transition"
                                >
                                    Thêm dòng nguyên liệu
                                </button>
                            </div>

                            {editMsg && (
                                <p className={`rounded p-2 text-xs font-semibold ${editMsg.isError ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                    {editMsg.text}
                                </p>
                            )}

                            <div className="flex justify-end gap-2 border-t pt-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditRecipeModal(false);
                                        setEditMsg(null);
                                    }}
                                    className="rounded border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={editLoading}
                                    className="rounded bg-[#c4956a] px-5 py-2 text-xs font-bold text-white shadow hover:bg-[#a97b52] disabled:opacity-50 transition"
                                >
                                    {editLoading ? 'Đang lưu...' : 'Lưu công thức'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
