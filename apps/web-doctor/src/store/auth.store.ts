import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User { id: string; email: string; firstName: string; lastName: string; role: string; avatar?: string; }

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string, refresh: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, token: null, isAuthenticated: false,
      setAuth: (user, token, refresh) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('dochain_doctor_token', token);
          localStorage.setItem('dochain_doctor_refresh', refresh);
        }
        set({ user, token, isAuthenticated: true });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dochain_doctor_token');
          localStorage.removeItem('dochain_doctor_refresh');
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
    }),
    { name: 'dochain-doctor-auth', partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }) }
  )
);
