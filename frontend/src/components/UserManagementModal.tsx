import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import type { Condominium, UserRole, Apartment } from "../types";
import LoadingOverlay from "./LoadingOverlay";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";

const API_BASE = import.meta.env.VITE_API_URL;

interface UserManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function UserManagementModal({
    isOpen,
    onClose,
}: UserManagementModalProps) {
    const { token, user } = useAuth();
    const authenticatedFetch = useAuthenticatedFetch();
    const [condominiums, setCondominiums] = useState<Condominium[]>([]);
    const [apartments, setApartments] = useState<Apartment[]>([]);

    // Form state
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("Morador");
    const [selectedCondominium, setSelectedCondominium] = useState<string>("");
    const [selectedApartment, setSelectedApartment] = useState<string>("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
        if (!isOpen || !token) return;

        const loadContent = async () => {
            try {
                const resCondos = await authenticatedFetch(
                    `${API_BASE}/api/condominiums`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                if (resCondos.ok) {
                    const cData = await resCondos.json();
                    setCondominiums(cData);
                    if (cData.length > 0) setSelectedCondominium(cData[0].id);
                }
            } catch (e) {
                console.error(e);
            }
        };

        loadContent();
    }, [isOpen, token, authenticatedFetch]);

    useEffect(() => {
        if (!isOpen || !token || !selectedCondominium || role !== "Morador")
            return;

        const loadApts = async () => {
            try {
                const resApt = await authenticatedFetch(
                    `${API_BASE}/api/apartments?condominiumId=${selectedCondominium}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                if (resApt.ok) {
                    const data = await resApt.json();
                    setApartments(data);
                    if (data.length > 0) setSelectedApartment(data[0].id);
                }
            } catch (e) {
                console.error(e);
            }
        };

        loadApts();
    }, [selectedCondominium, role, isOpen, token, authenticatedFetch]);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        try {
            const body = {
                name,
                email,
                password,
                role,
                condominiumIds: [selectedCondominium],
                apartmentId: role === "Morador" ? selectedApartment : null,
            };

            const res = await authenticatedFetch(
                `${API_BASE}/api/auth/register`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(body),
                },
            );

            if (res.ok) {
                setSuccess("Usuário criado com sucesso!");
                setName("");
                setEmail("");
                setPassword("");
                setTimeout(() => onClose(), 2000);
            } else {
                const data = await res.json();
                setError(data.message || "Erro ao criar usuário.");
            }
        } catch {
            setError("Erro de conexão. Tente novamente.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg p-8 transform scale-100 opacity-100 transition-all">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-slate-800">
                        Novo Usuário
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl text-sm font-medium border border-green-100">
                            {success}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            E-mail
                        </label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">
                            Senha Provisória
                        </label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all outline-none"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Tipo de Perfil
                            </label>
                            <select
                                value={role}
                                onChange={(e) =>
                                    setRole(e.target.value as UserRole)
                                }
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                            >
                                <option value="Morador">
                                    Morador / Inquilino
                                </option>
                                {user?.role === "Admin" && (
                                    <option value="Sindico">
                                        Síndico do Prédio
                                    </option>
                                )}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Condomínio
                            </label>
                            <select
                                value={selectedCondominium}
                                onChange={(e) =>
                                    setSelectedCondominium(e.target.value)
                                }
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                            >
                                {condominiums.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {role === "Morador" && (
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">
                                Vincular Apartamento
                            </label>
                            <select
                                value={selectedApartment}
                                onChange={(e) =>
                                    setSelectedApartment(e.target.value)
                                }
                                required
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 outline-none"
                            >
                                {apartments.length === 0 && (
                                    <option value="">
                                        Nenhum apt disponível...
                                    </option>
                                )}
                                {apartments.map((a) => (
                                    <option key={a.id} value={a.id}>
                                        {a.number} - {a.name}
                                    </option>
                                ))}
                            </select>
                            {apartments.length === 0 && selectedCondominium && (
                                <p className="text-xs text-amber-600 mt-1">
                                    Este condomínio não possui apartamentos.
                                    Crie-os primeiro.
                                </p>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-6 py-4 bg-primary-600 hover:bg-primary-700 text-white font-black rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
                    >
                        CRIAR ACESSO
                    </button>
                </form>
            </div>
            <LoadingOverlay isVisible={loading} text="Criando usuário..." />
        </div>
    );
}
