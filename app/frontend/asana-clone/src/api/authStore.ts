/**
 * Lightweight auth state. No external dependencies — just React context.
 * This will be replaced with Zustand when Wave 5 adds it as a dependency.
 */

import { createContext, useContext } from 'react';
import type { AuthUser } from './client';

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  setUser: () => {},
});

export const useAuth = () => useContext(AuthContext);
