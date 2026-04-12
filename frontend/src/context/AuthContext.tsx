import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { AuthContextType, AuthUser } from '../types';

const API_BASE = import.meta.env.VITE_API_URL;

const TOKEN_KEY = 'gascontrol_token';
const USER_KEY = 'gascontrol_user';

const ACTIVE_CONDO_KEY = 'gascontrol_active_condo';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function AuthProvider({ children }: { children: ReactNode }) {
	const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
	const [activeCondominiumId, setActiveCondominiumId] = useState<string | null>(() => localStorage.getItem(ACTIVE_CONDO_KEY));
	const [user, setUser] = useState<AuthUser | null>(() => {
		const raw = localStorage.getItem(USER_KEY);
		return raw ? (JSON.parse(raw) as AuthUser) : null;
	});

	const login = useCallback(async (email: string, password: string) => {
		try {
			const res = await fetch(`${API_BASE}/api/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) {
				return { success: false, error: 'E-mail ou senha inválidos.' };
			}

			const data = await res.json();
			const { token: jwt, user: userData } = data as { token: string; user: AuthUser };

			localStorage.setItem(TOKEN_KEY, jwt);
			localStorage.setItem(USER_KEY, JSON.stringify(userData));
			setToken(jwt);
			setUser(userData);
			
			if (userData.role === 'Morador' && userData.condominiumIds && userData.condominiumIds.length > 0) {
				localStorage.setItem(ACTIVE_CONDO_KEY, userData.condominiumIds[0]);
				setActiveCondominiumId(userData.condominiumIds[0]);
			} else {
			    setActiveCondominiumId(null);
                localStorage.removeItem(ACTIVE_CONDO_KEY);
            }

			return { success: true };
		} catch {
			return { success: false, error: 'Erro de conexão. Tente novamente.' };
		}
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem(TOKEN_KEY);
		localStorage.removeItem(USER_KEY);
        localStorage.removeItem(ACTIVE_CONDO_KEY);
		setToken(null);
		setUser(null);
        setActiveCondominiumId(null);
	}, []);

    const handleSetActiveCondo = useCallback((id: string | null) => {
        if (id) {
            localStorage.setItem(ACTIVE_CONDO_KEY, id);
        } else {
            localStorage.removeItem(ACTIVE_CONDO_KEY);
        }
        setActiveCondominiumId(id);
    }, []);

	return (
		<AuthContext.Provider
			value={{ token, user, isAuthenticated: !!token && !!user, activeCondominiumId, setActiveCondominiumId: handleSetActiveCondo, login, logout }}
		>
			{children}
		</AuthContext.Provider>
	);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextType {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
	return ctx;
}
