import { useAuth } from "../context/AuthContext";
import { useState } from "react";
import UserManagementModal from "./UserManagementModal";

interface NavigationHeaderProps {
    activeModule: "gas" | "water" | "finance" | "members";
    setActiveModule: (m: "gas" | "water" | "finance" | "members") => void;
}

export default function NavigationHeader({
    activeModule,
    setActiveModule,
}: NavigationHeaderProps) {
    const { logout, user } = useAuth();
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between items-center bg-white p-3 md:p-4 rounded-2xl shadow-sm border border-slate-100 mb-8 max-w-full">
                <div className="flex space-x-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
                    <button
                        onClick={() => setActiveModule("gas")}
                        className={`flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold transition-all whitespace-nowrap text-sm md:text-base ${
                            activeModule === "gas"
                                ? "bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-200"
                                : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                        }`}
                    >
                        🔥 GÁS
                    </button>
                    <button
                        onClick={() => setActiveModule("water")}
                        className={`flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold transition-all whitespace-nowrap text-sm md:text-base ${
                            activeModule === "water"
                                ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-200"
                                : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                        }`}
                    >
                        💧 ÁGUA
                    </button>
                    {user?.role !== "Morador" && (
                        <button
                            onClick={() => setActiveModule("finance")}
                            className={`flex-1 md:flex-none px-6 md:px-8 py-3 md:py-4 rounded-xl font-bold transition-all whitespace-nowrap text-sm md:text-base ${
                                activeModule === "finance"
                                    ? "bg-gradient-to-r from-slate-700 to-slate-900 text-white shadow-lg shadow-slate-300"
                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                            }`}
                        >
                            📊 FINANCEIRO
                        </button>
                    )}
                </div>

                <div className="flex items-center space-x-4 mt-4 md:mt-0 px-2 md:px-0 text-sm w-full md:w-auto justify-end">
                    {user?.role !== "Morador" && (
                        <button
                            onClick={() => setActiveModule("members")}
                            className={`px-4 md:px-6 py-2.5 md:py-3 rounded-xl font-bold transition-all whitespace-nowrap text-sm md:text-base ${
                                activeModule === "members"
                                    ? "bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-200"
                                    : "bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100"
                            }`}
                        >
                            👥 APTS & MEMBROS
                        </button>
                    )}
                    <div className="text-right flex-1 md:flex-none mr-2">
                        <div className="font-bold text-slate-800">
                            {user?.name}
                        </div>
                        <div className="text-xs text-slate-400 font-medium">
                            {user?.role === "Morador"
                                ? "Modo Visualização"
                                : `${user?.role} Mode`}
                        </div>
                    </div>

                    {user?.role !== "Morador" && (
                        <button
                            onClick={() => setIsUserModalOpen(true)}
                            className="bg-slate-50 text-slate-500 border border-slate-200 p-2 rounded-lg hover:bg-slate-100 hover:text-primary-600 transition-colors"
                            title="Gerenciar Usuários"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                                ></path>
                            </svg>
                        </button>
                    )}

                    <button
                        onClick={logout}
                        className="text-red-400 hover:text-red-600 font-bold px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
                    >
                        SAIR
                    </button>
                </div>
            </div>

            <UserManagementModal
                isOpen={isUserModalOpen}
                onClose={() => setIsUserModalOpen(false)}
            />
        </>
    );
}
