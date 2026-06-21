import { create } from 'zustand';
import { User } from '@/types';
import { tokenStorage } from '@/lib/api';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,

  hydrate: () => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    const token = tokenStorage.get();
    if (raw && token) {
      try {
        const user = JSON.parse(raw) as User;
        set({ user, isAuthenticated: true });
      } catch {}
    }
  },

  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },

  setTokens: (access, refresh) => {
    tokenStorage.set(access);
    tokenStorage.setRefresh(refresh);
  },

  logout: () => {
    tokenStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
}));
