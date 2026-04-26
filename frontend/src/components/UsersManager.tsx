import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import type { AuthUser } from '../types';
import { useAuthenticatedFetch } from '../hooks/useAuthenticatedFetch';

const API_BASE = import.meta.env.VITE_API_URL;

export default function UsersManager() {
    const { token, activeCondominiumId } = useAuth();
    const authenticatedFetch = useAuthenticatedFetch();
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [loading, setLoading] = useState(true);

    const loadUsers = useCallback(async () => {
        if (!token || !activeCondominiumId) return;

        try {
            setLoading(true);
            const res = await authenticatedFetch(`${API_BASE}/api/auth/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (res.ok) {
                const data: AuthUser[] = await res.json();
                // Filter users down to the active condominium visually
                const filtered = data.filter(u => 
                    u.condominiumIds && u.condominiumIds.includes(activeCondominiumId)
                );
                
                // Sort Admins -> Sindicos -> Morador
                const roleOrder = { 'Admin': 1, 'Sindico': 2, 'Morador': 3 };
                filtered.sort((a, b) => roleOrder[a.role] - roleOrder[b.role] || a.name.localeCompare(b.name));
                
                setUsers(filtered);
            }
        } catch (e) {
            console.error('Error loading users', e);
        } finally {
            setLoading(false);
        }
    }, [token, activeCondominiumId]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-black text-slate-800">Membros & Inquilinos</h2>
                    <p className="text-sm text-slate-500">Credenciais autorizadas neste condomínio</p>
                </div>
                <button 
                    onClick={loadUsers}
                    className="p-2 text-slate-400 hover:text-primary-600 bg-slate-50 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Recarregar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                </button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-slate-400 font-bold">Carregando usuários...</div>
            ) : users.length === 0 ? (
                <div className="text-center py-8 bg-slate-50 rounded-xl text-slate-500 border border-dashed border-slate-200">
                    <span className="block text-2xl mb-2">👤</span>
                    Nenhum usuário exclusivo encontrado neste condomínio.
                </div>
            ) : (
                <div className="space-y-3">
                    {users.map(u => (
                        <div key={u.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-primary-100 hover:bg-slate-50 transition-colors">
                            <div>
                                <div className="font-bold text-slate-700 flex items-center space-x-2">
                                    <span>{u.name}</span>
                                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                                        u.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                                        u.role === 'Sindico' ? 'bg-amber-100 text-amber-700' :
                                        'bg-slate-200 text-slate-600'
                                    }`}>
                                        {u.role}
                                    </span>
                                </div>
                                <div className="text-sm text-slate-400 mt-1">{u.email}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
