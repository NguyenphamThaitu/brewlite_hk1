import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = {
    id: number;
    email: string;
    loyaltyPoints: number;
    role?: 'CUSTOMER' | 'ADMIN';
};

type State = {
    token: string | null;
    user: User | null;
    setAuth: (token: string, user: User) => void;
    logout: () => void;
};

export const useAuth = create<State>()(
    persist(
        (set) => ({
            token: null,
            user: null,
            setAuth: (token, user) => set({ token, user }),
            logout: () => set({ token: null, user: null }),
        }),
        { name: 'brewlite-auth' },
    ),
);