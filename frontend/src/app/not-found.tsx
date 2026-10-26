import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '404 – Không tìm thấy trang | BrewLite',
    description: 'Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.',
};

export default function NotFound() {
    return (
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center px-4">
            {/* Big 404 */}
            <p className="text-[120px] font-extrabold leading-none tracking-tighter text-[#c4956a] opacity-20 select-none">
                404
            </p>

            <div className="-mt-10">
                <h1 className="text-3xl font-bold text-[#0f3a52]">
                    Không tìm thấy trang
                </h1>
                <p className="mt-3 max-w-md text-gray-500">
                    Trang bạn đang tìm kiếm không tồn tại, đã bị di chuyển hoặc địa chỉ URL không đúng.
                </p>
            </div>

            <Link
                href="/"
                className="rounded-md bg-[#0f3a52] px-6 py-3 text-sm font-semibold text-white hover:bg-[#c4956a] transition-colors"
            >
                ← Về trang chủ
            </Link>
        </div>
    );
}
