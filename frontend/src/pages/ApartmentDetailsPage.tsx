import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import LoadingOverlay from "../components/LoadingOverlay";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from "recharts";
import type { Apartment } from "../types";

const API_BASE = import.meta.env.VITE_API_URL;

interface ReadingData {
    month: string;
    currentReading: number;
}

interface ApartmentHistoryData {
    apartment: Apartment;
    gasReadings: ReadingData[];
    waterReadings: ReadingData[];
}

export default function ApartmentDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { token } = useAuth();
    const authenticatedFetch = useAuthenticatedFetch();
    
    const [data, setData] = useState<ApartmentHistoryData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<"charts" | "table">("charts");

    const fetchHistory = useCallback(async () => {
        if (!token || !id) return;
        setIsLoading(true);
        try {
            // limit=13 so we can calculate consumption for the last 12 months
            const res = await authenticatedFetch(`${API_BASE}/api/apartments/${id}/history?limit=13`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const historyData = await res.json();
                setData(historyData);
            }
        } catch (error) {
            console.error("Erro ao buscar histórico do apartamento", error);
        } finally {
            setIsLoading(false);
        }
    }, [token, id, authenticatedFetch]);

    useEffect(() => {
        void fetchHistory();
    }, [fetchHistory]);

    // Data processing
    const processedData = useMemo(() => {
        if (!data) return [];
        
        const monthsSet = new Set<string>();
        data.gasReadings.forEach(r => monthsSet.add(r.month));
        data.waterReadings.forEach(r => monthsSet.add(r.month));
        
        // Sort ascending (oldest to newest)
        const sortedMonthsAsc = Array.from(monthsSet).sort();

        const result = [];
        for (let i = 0; i < sortedMonthsAsc.length; i++) {
            const month = sortedMonthsAsc[i];
            const gas = data.gasReadings.find(r => r.month === month);
            const water = data.waterReadings.find(r => r.month === month);

            let gasConsumoRaw: number | null = null;
            let waterConsumoRaw: number | null = null;

            if (i > 0) {
                const prevMonth = sortedMonthsAsc[i - 1];
                const prevGas = data.gasReadings.find(r => r.month === prevMonth);
                const prevWater = data.waterReadings.find(r => r.month === prevMonth);

                if (gas && prevGas) gasConsumoRaw = Math.max(0, gas.currentReading - prevGas.currentReading);
                if (water && prevWater) waterConsumoRaw = Math.max(0, water.currentReading - prevWater.currentReading);
            }

            const [yyyy, mm] = month.split('-');
            const monthDisplay = `${mm}/${yyyy.substring(2)}`;

            result.push({
                month,
                monthDisplay,
                gasLeitura: gas?.currentReading ?? null,
                waterLeitura: water?.currentReading ?? null,
                gasConsumoRaw,
                waterConsumoRaw,
                // Fallbacks for chart rendering
                gasConsumo: gasConsumoRaw !== null ? Number(gasConsumoRaw.toFixed(3)) : 0,
                waterConsumo: waterConsumoRaw !== null ? Number(waterConsumoRaw.toFixed(3)) : 0,
            });
        }

        return result;
    }, [data]);

    const chartData = useMemo(() => {
        // Filter out items that completely lack consumption data (e.g., the 13th/first month used only as baseline)
        return processedData.filter(d => d.gasConsumoRaw !== null || d.waterConsumoRaw !== null);
    }, [processedData]);

    const tableData = [...processedData].reverse();

    if (!data && !isLoading) {
        return (
            <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
                <p className="text-slate-500 mb-4">Apartamento não encontrado ou sem dados.</p>
                <button onClick={() => navigate(-1)} className="text-primary-600 font-bold hover:underline">
                    Voltar
                </button>
            </div>
        );
    }

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg text-sm">
                    <p className="font-bold text-slate-700 mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            <span className="text-slate-600 font-medium">{entry.name}:</span>
                            <span className="font-bold" style={{ color: entry.color }}>{entry.value} m³</span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-slate-50 text-slate-800 p-6 md:p-12 font-sans">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div>
                        <button 
                            onClick={() => navigate(-1)}
                            className="text-slate-400 hover:text-slate-600 mb-2 flex items-center text-sm font-bold transition-colors"
                        >
                            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            VOLTAR
                        </button>
                        <h1 className="text-2xl font-black text-slate-800">
                            Apt {data?.apartment.number}
                        </h1>
                        <p className="text-slate-500 text-sm">{data?.apartment.name || "Sem morador associado"}</p>
                    </div>
                </div>

                {/* Tabs & Content Container */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-8">
                    {/* Tabs */}
                    <div className="flex space-x-6 border-b border-slate-100 mb-6">
                        <button
                            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'charts' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setActiveTab('charts')}
                        >
                            Gráficos de Consumo
                        </button>
                        <button
                            className={`pb-3 px-1 text-sm font-bold border-b-2 transition-colors ${activeTab === 'table' ? 'border-primary-500 text-primary-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            onClick={() => setActiveTab('table')}
                        >
                            Histórico em Tabela
                        </button>
                    </div>

                    {/* Content */}
                    {activeTab === 'charts' && (
                        <div className="space-y-12">
                            {chartData.length === 0 ? (
                                <p className="text-center text-slate-400 py-10">Dados insuficientes para gerar gráficos de consumo (é necessário mais de 1 mês de leitura).</p>
                            ) : (
                                <>
                                    {/* Gas Chart */}
                                    <div className="w-full">
                                        <h3 className="text-lg font-bold text-emerald-700 mb-6 flex items-center">
                                            <span className="text-xl mr-2">🔥</span> Consumo Mensal de Gás (m³)
                                        </h3>
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="monthDisplay" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                                    <Bar dataKey="gasConsumo" name="Gás" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Water Chart */}
                                    <div className="w-full">
                                        <h3 className="text-lg font-bold text-blue-700 mb-6 flex items-center">
                                            <span className="text-xl mr-2">💧</span> Consumo Mensal de Água (m³)
                                        </h3>
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                    <XAxis dataKey="monthDisplay" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} dy={10} />
                                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                                    <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                                    <Bar dataKey="waterConsumo" name="Água" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'table' && (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 rounded-t-lg">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 rounded-tl-lg font-bold">Mês</th>
                                        <th scope="col" className="px-6 py-3 font-bold text-emerald-600 border-l border-white">Gás (Leitura)</th>
                                        <th scope="col" className="px-6 py-3 font-bold text-emerald-700">Consumo Gás</th>
                                        <th scope="col" className="px-6 py-3 font-bold text-blue-600 border-l border-white">Água (Leitura)</th>
                                        <th scope="col" className="px-6 py-3 rounded-tr-lg font-bold text-blue-700">Consumo Água</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tableData.map((row) => (
                                        <tr key={row.month} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-slate-700 whitespace-nowrap">{row.month}</td>
                                            
                                            <td className="px-6 py-4 text-emerald-600/70 border-l border-slate-50 font-medium">
                                                {row.gasLeitura !== null ? row.gasLeitura.toFixed(3) : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-emerald-700 font-bold bg-emerald-50/30">
                                                {row.gasConsumoRaw !== null ? `+${row.gasConsumoRaw.toFixed(3)}` : "-"}
                                            </td>
                                            
                                            <td className="px-6 py-4 text-blue-600/70 border-l border-slate-50 font-medium">
                                                {row.waterLeitura !== null ? row.waterLeitura.toFixed(3) : "-"}
                                            </td>
                                            <td className="px-6 py-4 text-blue-700 font-bold bg-blue-50/30">
                                                {row.waterConsumoRaw !== null ? `+${row.waterConsumoRaw.toFixed(3)}` : "-"}
                                            </td>
                                        </tr>
                                    ))}
                                    {tableData.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                                                Nenhuma leitura registrada.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                            <p className="mt-4 text-xs text-slate-400 text-center">
                                * O consumo é calculado pela diferença entre a leitura do mês e a do mês anterior.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            <LoadingOverlay isVisible={isLoading} text="Carregando dados..." />
        </div>
    );
}
