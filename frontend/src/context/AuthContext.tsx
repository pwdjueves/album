import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { AuthResponse, LoginInput, RegisterInput, User } from '../types/auth';
type AuthContextValue = { user: User | null; login: (i: LoginInput) => Promise<void>; register: (i: RegisterInput) => Promise<void>; logout: () => void };
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
function save({ user, token }: AuthResponse) { localStorage.setItem('album_token', token); localStorage.setItem('album_user', JSON.stringify(user)); return user; }
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => { const value = localStorage.getItem('album_user'); return value ? JSON.parse(value) as User : null; });
  const value = useMemo(() => ({ user, login: async (i: LoginInput) => setUser(save(await authService.login(i))), register: async (i: RegisterInput) => setUser(save(await authService.register(i))), logout: () => { localStorage.removeItem('album_token'); localStorage.removeItem('album_user'); setUser(null); } }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error('useAuth debe utilizarse dentro de AuthProvider'); return value; }
