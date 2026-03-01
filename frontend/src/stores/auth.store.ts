import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, PendingVerificationContext } from '../types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  pendingVerification: PendingVerificationContext | null;

  // Acciones
  setAuth: (user: User, accessToken: string) => void;
  setPendingVerification: (context: PendingVerificationContext) => void;
  clearPendingVerification: () => void;
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      pendingVerification: null,

      setAuth: (user, accessToken) =>
        set({
          user,
          accessToken,
          isAuthenticated: true,
          pendingVerification: null,
        }),

      setPendingVerification: (pendingVerification) =>
        set({
          pendingVerification,
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }),

      clearPendingVerification: () =>
        set({ pendingVerification: null }),

      setUser: (user) => set({ user }),

      setAccessToken: (accessToken) =>
        set({ accessToken }),

      logout: () =>
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          pendingVerification: null,
        }),
    }),
    {
      name: 'lifeos-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
        pendingVerification: state.pendingVerification,
      }),
    },
  ),
);
