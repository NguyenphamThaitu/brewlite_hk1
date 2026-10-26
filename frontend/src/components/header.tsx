'use client';
import Link from 'next/link';
import { cartCount, useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { useHydrated } from '@/lib/useHydrated';

const link =
    'rounded px-3 py-2 text-sm font-semibold uppercase tracking-wide text-white hover:bg-[#c4956a] hover:text-white';

export default function Header() {
    const hydrated = useHydrated();
    const count = useCart((s) => cartCount(s.items));
    const user = useAuth((s) => s.user);
    const logout = useAuth((s) => s.logout);

    return (
        <header className="bg-[#0f3a52] px-6 py-4 shadow">
            <div className="mx-auto flex max-w-5xl items-center justify-between">
                <Link href="/" className="text-2xl font-bold tracking-widest text-[#c4956a] hover:text-[#e0b58c]">
                    BREWLITE
                </Link>
                <nav className="flex items-center gap-1">
                    <Link href="/cart" className={link}>
                        Giỏ hàng ({hydrated ? count : 0})
                    </Link>
                    {hydrated && user ? (
                        <>
                            <Link href="/orders" className={link}>Đơn của tôi</Link>
                            <button onClick={logout} className={link}>Đăng xuất</button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className={link}>Đăng nhập</Link>
                            <Link href="/register" className={link}>Đăng ký</Link>
                        </>
                    )}
                </nav>
            </div>
        </header>
    );
}