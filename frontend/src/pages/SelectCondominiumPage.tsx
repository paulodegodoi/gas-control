import { useEffect, useState, FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import type { Condominium } from '../types';

const API_BASE = import.meta.env.VITE_API_URL;

export default function SelectCondominiumPage() {
    const { token, user, setActiveCondominiumId, refreshContext } = useAuth();
    const navigate = useNavigate();
    const [condominiums, setCondominiums] = useState<Condominium[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');

    useEffect(() => {
        if (!token) return;

        const fetchCondos = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/condominiums`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setCondominiums(data);
                }
            } catch (e) {
                console.error('Error fetching condominiums', e);
            } finally {
                setLoading(false);
            }
        };

        fetchCondos();
    }, [token]);

    const handleSelect = (id: string) => {
        setActiveCondominiumId(id);
        navigate('/');
    };

    const handleCreate = async (e: FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !token) return;

        try {
            const res = await fetch(`${API_BASE}/api/condominiums`, {
                method: 'POST',
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: newName })
            });

            if (res.ok) {
                const created = await res.json();
                setCondominiums(prev => [...prev, created]);
                setIsCreating(false);
                setNewName('');

                if (user?.role === 'Sindico') {
                    await refreshContext();
                }
            }
        } catch (e) {
            console.error('Error creating condominium', e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-400 font-bold">Carregando condomínios...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
            <div className="max-w-2xl w-full">

                <div className="text-center mb-10">
                    <h1 className="text-4xl font-black mb-2">GasControl</h1>
                    <p className="text-lg text-slate-500">
                        Olá, {user?.name}. Selecione um condomínio para continuar.
                    </p>
                </div>

                {condominiums.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                        {condominiums.map(condo => (
                            <button
                                key={condo.id}
                                onClick={() => handleSelect(condo.id)}
                                className="group relative bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-left hover:shadow-lg hover:border-primary-300 hover:ring-2 hover:ring-primary-100 transition-all focus:outline-none"
                            >
                                <div className="text-3xl mb-3 opacity-80 group-hover:scale-110 transition-transform origin-left">🏢</div>
                                <h3 className="text-xl font-bold text-slate-800">{condo.name}</h3>
                                <div className="absolute top-6 right-6 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                    <span className="text-primary-500 font-black">→</span>
                                </div>
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white p-12 rounded-3xl shadow-sm border border-slate-200 text-center mb-8">
                        <div className="text-5xl mb-4 opacity-50">🏗️</div>
                        <h2 className="text-2xl font-bold mb-2">Nenhum Condomínio</h2>
                        <p className="text-slate-500 mb-6">
                            Você ainda não tem acesso a nenhum condomínio.
                            {user?.role === 'Admin' ? ' Vamos criar o seu primeiro?' : ''}
                        </p>
                    </div>
                )}

                {user?.role !== 'Morador' && (
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
                        {!isCreating ? (
                            <button
                                onClick={() => setIsCreating(true)}
                                className="w-full py-4 rounded-xl border-2 border-dashed border-slate-300 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-700 hover:border-slate-400 transition-all"
                            >
                                + Registrar Novo Condomínio
                            </button>
                        ) : (
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-2">
                                        Nome do Condomínio
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        autoFocus
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                                        placeholder="Ex: Residencial Flores"
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsCreating(false)}
                                        className="flex-1 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl shadow-lg shadow-primary-200 transition-all active:scale-95"
                                    >
                                        Salvar e Criar
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
}
