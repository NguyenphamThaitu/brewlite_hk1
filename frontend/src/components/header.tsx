'use client';
import Link from 'next/link';
import { cartCount, useCart } from '@/store/cart';
import { useAuth } from '@/store/auth';
import { useHydrated } from '@/lib/useHydrated';

export default function Header() {
    const hydrated = useHydrated();
    const count = useCart((s) => cartCount(s.items));
    const user = useAuth((s) => s.user);
    const logout = useAuth((s) => s.logout);

    return (
        <header className="flex items-center justify-between border-b p-4">
            <Link href="/" className="text-xl font-bold">
                ☕ BrewLite
            </Link>
            <nav className="flex gap-4">
                <Link href="/cart">Giỏ hàng ({hydrated ? count : 0})</Link>
                {hydrated && user ? (
                    <>
                        <Link href="/orders">Đơn của tôi</Link>
                        <button onClick={logout}>Đăng xuất</button>
                    </>
                ) : (
                    <>
                    <Link href="/login">Đăng nhập</Link>
                    <Link href="/register">Đăng ký</Link>
                    </>
                )}
            </nav>
        </header>
    );
}