'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth, type User } from '@/store/auth';

export default function AuthForm({ mode }: { mode: 'login' | 'register' }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const setAuth = useAuth((s) => s.setAuth);
    const router = useRouter();

    async function submit(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const r = await api<{ accessToken: string; user: User }>(`/auth/${mode}`, {
                method: 'POST',
                body: JSON.stringify({ email, password }),
            });
            setAuth(r.accessToken, r.user);
            router.push('/cart');
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={submit} className="max-w-sm space-y-3">
            <h1 className="text-xl font-bold">{mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}</h1>
            <input
                className="w-full rounded border p-2"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                className="w-full rounded border p-2"
                type="password"
                placeholder="Mật khẩu (từ 6 ký tự)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            {error && <p className="text-red-600">{error}</p>}
            <button disabled={loading} className="rounded bg-amber-700 px-4 py-2 text-white">
                {loading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Đăng ký'}
            </button>
        </form>
    );
}