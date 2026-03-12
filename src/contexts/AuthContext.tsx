"use client";

import { createContext, useContext, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/authStore';

type AuthContextValue = {
  user: string | null;
  session: { user: string } | null;
  loading: boolean;
  signOut: () => void;
  resetPassword: (email: string) => Promise<{ error?: { message: string } }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const value: AuthContextValue = {
    user,
    session: user ? { user } : null,
    loading: false,
    signOut: () => setUser(null),
    resetPassword: async () => {
      // Stub: no backend. Wire to your API when ready.
      return {};
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
