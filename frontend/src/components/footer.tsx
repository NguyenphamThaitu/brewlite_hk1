import Link from 'next/link';

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="mt-auto bg-[#0b2d40] text-white">
            <div className="mx-auto max-w-5xl px-6 py-8">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
                    {/* Brand */}
                    <div>
                        <span className="text-xl font-bold tracking-widest text-[#c4956a]">
                            BREWLITE
                        </span>
                        <p className="mt-1 text-sm text-gray-400">
                            Đặt đồ uống không dùng tiền mặt
                        </p>
                    </div>

                    {/* Quick links */}
                    <nav className="flex gap-4 text-sm">
                        <Link
                            href="/"
                            className="text-gray-300 hover:text-[#c4956a] transition-colors"
                        >
                            Trang chủ
                        </Link>
                        <Link
                            href="/cart"
                            className="text-gray-300 hover:text-[#c4956a] transition-colors"
                        >
                            Giỏ hàng
                        </Link>
                        <Link
                            href="/orders"
                            className="text-gray-300 hover:text-[#c4956a] transition-colors"
                        >
                            Đơn hàng
                        </Link>
                    </nav>
                </div>

                <hr className="my-6 border-[#1a4a6b]" />

                <p className="text-center text-xs text-gray-500">
                    © {year} BrewLite — Nhóm sinh viên thực hành kỹ thuật phần mềm.
                </p>
            </div>
        </footer>
    );
}
