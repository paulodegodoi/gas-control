import { useState, useEffect, Fragment, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
    DollarSign,
    TrendingUp,
    Calendar,
    PieChart,
    ChevronDown,
    ChevronRight,
    Plus,
    CornerDownRight,
    X,
    Save,
    Loader2,
    Edit2,
    Trash2,
    Copy,
    Download,
} from "lucide-react";
import LoadingOverlay from "./LoadingOverlay";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import type { FinanceCategoryType } from "../types";
const API_BASE = import.meta.env.VITE_API_URL;

const CATEGORIAS = [
    "Pessoal",
    "Consumo",
    "Manutenção",
    "Material",
    "Seguros",
    "Administrativo",
    "Fundo de Reserva",
];
const MESES = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
];

interface SubCategory {
    id: string;
    name: string;
    values: number[];
}

interface CategoryData {
    id: string;
    name: string;
    baseValues: number[];
    subCategories: SubCategory[];
}

export default function FinanceDashboardView({
    type,
    title,
    subtitle
}: {
    type: FinanceCategoryType;
    title: string;
    subtitle: string;
}) {
    const { token, activeCondominiumId } = useAuth();
    const authenticatedFetch = useAuthenticatedFetch();
    const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
    const [isSubCatModalOpen, setIsSubCatModalOpen] = useState(false);
    const [activeParentCat, setActiveParentCat] = useState<string | null>(null);
    const [newSubCatName, setNewSubCatName] = useState("");
    const [activeEditSubId, setActiveEditSubId] = useState<string | null>(null);
    const [deleteConfirmData, setDeleteConfirmData] = useState<{
        catName: string;
        subId: string;
    } | null>(null);
    const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);

    const [year, setYear] = useState(new Date().getFullYear());
    const [data, setData] = useState<Record<string, CategoryData>>({});
    const [originalDataStr, setOriginalDataStr] = useState<string>("{}");
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (!token || !activeCondominiumId) return;

        const fetchData = async () => {
            setIsLoading(true);
            try {
                const res = await authenticatedFetch(
                    `${API_BASE}/api/finance/${activeCondominiumId}/${year}/${type}`,
                    {
                        headers: { Authorization: `Bearer ${token}` },
                    },
                );
                if (res.ok) {
                    const fetchedData: CategoryData[] = await res.json();
                    const record: Record<string, CategoryData> = {};

                    // Organize by category name
                    CATEGORIAS.forEach((catName) => {
                        const found = fetchedData.find(
                            (c) => c.name === catName,
                        );
                        if (found) {
                            record[catName] = found;
                        }
                    });
                    setData(record);
                    setOriginalDataStr(JSON.stringify(record));
                }
            } catch (error) {
                console.error("Error fetching finance data", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [token, activeCondominiumId, year, type, authenticatedFetch]);

    const handleSave = async () => {
        if (!token || !activeCondominiumId) return;
        setIsSaving(true);

        try {
            const payload = CATEGORIAS.map((cat) => data[cat]).filter(Boolean); // All available categories
            const res = await authenticatedFetch(
                `${API_BASE}/api/finance/sync/${activeCondominiumId}/${year}/${type}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                },
            );
            if (res.ok) {
                setOriginalDataStr(JSON.stringify(data));
                // optional: show success toast
            }
        } catch (error) {
            console.error("Error saving finance data", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleExportPdf = async () => {
        if (!token || !activeCondominiumId) return;
        setIsExporting(true);
        try {
            const res = await authenticatedFetch(
                `${API_BASE}/api/finance/${activeCondominiumId}/${year}/${type}/export`,
                {
                    headers: { Authorization: `Bearer ${token}` },
                },
            );
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Dashboard_Financeiro_${type}_${year}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                console.error("Failed to export PDF", res.status);
            }
        } catch (error) {
            console.error("Error exporting PDF", error);
        } finally {
            setIsExporting(false);
        }
    };

    const calculateTotalAnualBase = (cat: string) =>
        data[cat]?.baseValues.reduce((acc, curr) => acc + curr, 0) || 0;
    const calculateTotalAnualSubCat = (sub: SubCategory) =>
        sub.values.reduce((acc, curr) => acc + curr, 0);

    const calculateTotalAnualCategory = (cat: string) => {
        if (!data[cat]) return 0;
        return (
            calculateTotalAnualBase(cat) +
            data[cat].subCategories.reduce(
                (acc, sub) => acc + calculateTotalAnualSubCat(sub),
                0,
            )
        );
    };

    // Summary data
    const totalGeralAno = CATEGORIAS.reduce(
        (acc, cat) => acc + calculateTotalAnualCategory(cat),
        0,
    );
    const mediaMensalTotal = totalGeralAno / 12;

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
        }).format(value);
    };

    const toggleExpand = (cat: string) => {
        setExpandedCats((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) next.delete(cat);
            else next.add(cat);
            return next;
        });
    };

    const openSubCatModal = (
        parentCat: string,
        editSubId: string | null = null,
        currentName: string = "",
    ) => {
        setActiveParentCat(parentCat);
        setActiveEditSubId(editSubId);
        setNewSubCatName(editSubId ? currentName : "");
        setIsSubCatModalOpen(true);
    };

    const requestDeleteSubCategory = (catName: string, subId: string) => {
        setDeleteConfirmData({ catName, subId });
    };

    const confirmDeleteSubCategory = () => {
        if (!deleteConfirmData) return;
        const { catName, subId } = deleteConfirmData;
        setData((prev) => {
            const newData = { ...prev };
            const newSubs = newData[catName].subCategories.filter(
                (s) => s.id !== subId,
            );
            newData[catName] = { ...newData[catName], subCategories: newSubs };
            return newData;
        });
        setDeleteConfirmData(null);
    };

    const confirmAddSubCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSubCatName.trim() || !activeParentCat) return;

        setData((prev) => {
            const newData = { ...prev };
            const catData = newData[activeParentCat];

            // Se for a primeira subcategoria e existir valores na base, migramos para 'Geral' para não congelar os valores
            const subsToKeep = [...catData.subCategories];

            if (activeEditSubId) {
                // Edit
                const subIndex = subsToKeep.findIndex(
                    (s) => s.id === activeEditSubId,
                );
                if (subIndex > -1) {
                    subsToKeep[subIndex] = {
                        ...subsToKeep[subIndex],
                        name: newSubCatName.trim(),
                    };
                }
            } else {
                // Add
                const hasExistingBaseValues = catData.baseValues.some(
                    (v) => v > 0,
                );
                if (subsToKeep.length === 0 && hasExistingBaseValues) {
                    subsToKeep.push({
                        id: crypto.randomUUID(),
                        name: "Geral",
                        values: [...catData.baseValues],
                    });
                    catData.baseValues = Array(12).fill(0);
                }

                subsToKeep.push({
                    id: crypto.randomUUID(),
                    name: newSubCatName.trim(),
                    values: Array(12).fill(0),
                });
            }

            newData[activeParentCat] = {
                ...catData,
                subCategories: subsToKeep,
            };
            return newData;
        });

        if (!activeEditSubId) {
            setExpandedCats((prev) => new Set(prev).add(activeParentCat));
        }
        setIsSubCatModalOpen(false);
    };

    const handleBaseValueChange = (
        catName: string,
        monthIdx: number,
        value: number,
    ) => {
        setData((prev) => {
            const newData = { ...prev };
            const newBase = [...newData[catName].baseValues];
            newBase[monthIdx] = value;
            newData[catName] = { ...newData[catName], baseValues: newBase };
            return newData;
        });
    };

    const handleSubValueChange = (
        catName: string,
        subId: string,
        monthIdx: number,
        value: number,
    ) => {
        setData((prev) => {
            const newData = { ...prev };
            const newSubs = newData[catName].subCategories.map((sub) => {
                if (sub.id === subId) {
                    const newVals = [...sub.values];
                    newVals[monthIdx] = value;
                    return { ...sub, values: newVals };
                }
                return sub;
            });
            newData[catName] = { ...newData[catName], subCategories: newSubs };
            return newData;
        });
    };

    const handleRepeatBaseValue = (catName: string, value: number) => {
        setData((prev) => {
            const newData = { ...prev };
            newData[catName] = {
                ...newData[catName],
                baseValues: Array(12).fill(value),
            };
            return newData;
        });
    };

    const handleRepeatSubValue = (
        catName: string,
        subId: string,
        value: number,
    ) => {
        setData((prev) => {
            const newData = { ...prev };
            const newSubs = newData[catName].subCategories.map((sub) => {
                if (sub.id === subId) {
                    return { ...sub, values: Array(12).fill(value) };
                }
                return sub;
            });
            newData[catName] = { ...newData[catName], subCategories: newSubs };
            return newData;
        });
    };

    const isDirty = useMemo(() => {
        return JSON.stringify(data) !== originalDataStr;
    }, [data, originalDataStr]);

    return (
        <div className="space-y-6">
            {/* Header: Titulo + Controles */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">
                        {title}
                    </h1>
                    <p className="text-sm text-slate-500">
                        {subtitle}
                    </p>
                </div>

                <div className="flex items-center space-x-3 w-full md:w-auto">
                    <div className="relative">
                        <button
                            onClick={() =>
                                setIsYearDropdownOpen(!isYearDropdownOpen)
                            }
                            className="bg-white border border-slate-200 hover:border-blue-300 rounded-xl px-4 py-2.5 flex items-center shadow-sm text-sm font-medium text-slate-700 transition-colors w-32 justify-between"
                        >
                            <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                                {year}
                            </div>
                            <ChevronDown
                                className={`w-4 h-4 text-slate-400 transition-transform ${isYearDropdownOpen ? "rotate-180" : ""}`}
                            />
                        </button>

                        {isYearDropdownOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-40"
                                    onClick={() => setIsYearDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-32 bg-white rounded-xl shadow-lg border border-slate-100 z-50 overflow-hidden py-1 max-h-64 overflow-y-auto hide-scrollbar">
                                    {[...Array(15)].map((_, i) => {
                                        const y =
                                            new Date().getFullYear() - 5 + i; // spanning -5 years up to +9 years
                                        return (
                                            <button
                                                key={y}
                                                onClick={() => {
                                                    setYear(y);
                                                    setIsYearDropdownOpen(
                                                        false,
                                                    );
                                                }}
                                                className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                                                    year === y
                                                        ? "bg-blue-50 text-blue-700 font-bold"
                                                        : "text-slate-600 hover:bg-slate-50"
                                                }`}
                                            >
                                                {y}
                                            </button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    <button
                        onClick={handleExportPdf}
                        disabled={isExporting}
                        className="flex-1 md:flex-none flex items-center justify-center px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isExporting ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Exportar PDF
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !isDirty}
                        className="flex-1 md:flex-none flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm shadow-blue-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        {isSaving ? "Salvando..." : "Salvar Alterações"}
                    </button>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">
                            Gasto Previsto Ano
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                            {formatCurrency(totalGeralAno)}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">
                            Média Mensal Global
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                            {formatCurrency(mediaMensalTotal)}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">
                            Maior Custo Mensal
                        </div>
                        <div className="text-2xl font-bold text-slate-800">
                            {formatCurrency(
                                Math.max(
                                    ...Array.from({ length: 12 }).map((_, i) =>
                                        CATEGORIAS.reduce(
                                            (acc, cat) =>
                                                acc +
                                                (data[cat]?.baseValues[i] ||
                                                    0) +
                                                ((
                                                    data[cat]?.subCategories ||
                                                    []
                                                ).reduce(
                                                    (subAcc, sub) =>
                                                        subAcc + sub.values[i],
                                                    0,
                                                ) || 0),
                                            0,
                                        ),
                                    ),
                                ),
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center space-x-4">
                    <div className="bg-violet-50 p-3 rounded-xl text-violet-600">
                        <PieChart className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-500">
                            Categoria Principal
                        </div>
                        <div
                            className="text-2xl font-bold text-slate-800 truncate max-w-[120px]"
                            title={CATEGORIAS.reduce((prev, current) =>
                                calculateTotalAnualCategory(prev) >
                                calculateTotalAnualCategory(current)
                                    ? prev
                                    : current,
                            )}
                        >
                            {CATEGORIAS.reduce((prev, current) =>
                                calculateTotalAnualCategory(prev) >
                                calculateTotalAnualCategory(current)
                                    ? prev
                                    : current,
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabela de Dashboard */}
            <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800">
                        Despesas por Categoria
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                        Preencha as células para definir os custos previstos do
                        ano.
                    </p>
                </div>

                <div className="overflow-x-auto hide-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[max-content]">
                        <thead>
                            <tr>
                                <th className="py-4 px-6 bg-slate-50 text-slate-600 font-semibold text-sm uppercase tracking-wider border-b border-slate-200">
                                    Categoria
                                </th>
                                {MESES.map((mes) => (
                                    <th
                                        key={mes}
                                        className="py-4 px-4 bg-slate-50 text-slate-600 font-semibold text-sm uppercase tracking-wider border-b border-slate-200 text-right"
                                    >
                                        {mes}
                                    </th>
                                ))}
                                <th className="py-4 px-6 bg-blue-50 text-blue-900 font-bold text-sm uppercase tracking-wider border-b border-blue-100 text-right">
                                    Total Anual
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {CATEGORIAS.map((cat, idx) => {
                                const catData = data[cat];
                                if (!catData) return null; // Wait for load

                                const isExpanded = expandedCats.has(cat);
                                const hasSubCats =
                                    catData.subCategories.length > 0;

                                return (
                                    <Fragment key={cat}>
                                        <tr className="group hover:bg-slate-50/80 transition-colors">
                                            <td className="py-2 px-6 text-sm font-medium text-slate-800 border-r border-slate-50 bg-white group-hover:bg-slate-50 sticky left-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] z-10 w-64">
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className={`flex items-center space-x-3 select-none ${hasSubCats ? "cursor-pointer" : ""}`}
                                                        onClick={() =>
                                                            hasSubCats &&
                                                            toggleExpand(cat)
                                                        }
                                                    >
                                                        <div
                                                            className={`w-3 h-3 rounded-full shrink-0
                                                            ${
                                                                idx % 7 === 0
                                                                    ? "bg-blue-500"
                                                                    : idx %
                                                                            7 ===
                                                                        1
                                                                      ? "bg-indigo-500"
                                                                      : idx %
                                                                              7 ===
                                                                          2
                                                                        ? "bg-emerald-500"
                                                                        : idx %
                                                                                7 ===
                                                                            3
                                                                          ? "bg-amber-500"
                                                                          : idx %
                                                                                  7 ===
                                                                              4
                                                                            ? "bg-rose-500"
                                                                            : idx %
                                                                                    7 ===
                                                                                5
                                                                              ? "bg-purple-500"
                                                                              : "bg-cyan-500"
                                                            }`}
                                                        />
                                                        <span className="whitespace-nowrap flex items-center">
                                                            {cat}
                                                            {hasSubCats &&
                                                                (isExpanded ? (
                                                                    <ChevronDown className="w-4 h-4 ml-1 text-slate-400" />
                                                                ) : (
                                                                    <ChevronRight className="w-4 h-4 ml-1 text-slate-400" />
                                                                ))}
                                                        </span>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            openSubCatModal(
                                                                cat,
                                                            );
                                                        }}
                                                        className="p-1 rounded bg-slate-100 text-slate-400 hover:bg-blue-100 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-all"
                                                        title="Adicionar Subcategoria"
                                                    >
                                                        <Plus className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                            {Array.from({ length: 12 }).map(
                                                (_, mIdx) => {
                                                    const monthlyTotal =
                                                        catData.baseValues[
                                                            mIdx
                                                        ] +
                                                        catData.subCategories.reduce(
                                                            (acc, sub) =>
                                                                acc +
                                                                sub.values[
                                                                    mIdx
                                                                ],
                                                            0,
                                                        );

                                                    return (
                                                        <td
                                                            key={mIdx}
                                                            className="py-2 px-2 text-sm text-slate-600 text-right group-hover:text-slate-900 transition-colors group/cell relative"
                                                        >
                                                            {hasSubCats ? (
                                                                <div className="px-2 font-medium">
                                                                    {formatCurrency(
                                                                        monthlyTotal,
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center justify-end">
                                                                    <button
                                                                        onClick={() =>
                                                                            handleRepeatBaseValue(
                                                                                cat,
                                                                                catData
                                                                                    .baseValues[
                                                                                    mIdx
                                                                                ] ||
                                                                                    0,
                                                                            )
                                                                        }
                                                                        className="mr-1 opacity-0 group-hover/cell:opacity-100 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                                                                        title="Repetir valor para todos os meses"
                                                                    >
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </button>
                                                                    <input
                                                                        type="number"
                                                                        value={
                                                                            catData
                                                                                .baseValues[
                                                                                mIdx
                                                                            ] ||
                                                                            ""
                                                                        }
                                                                        onChange={(
                                                                            e,
                                                                        ) =>
                                                                            handleBaseValueChange(
                                                                                cat,
                                                                                mIdx,
                                                                                Number(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                ) ||
                                                                                    0,
                                                                            )
                                                                        }
                                                                        className="w-20 md:w-24 bg-transparent outline-none border border-transparent hover:border-slate-200 focus:border-blue-500 rounded p-1 text-right transition-colors"
                                                                    />
                                                                </div>
                                                            )}
                                                        </td>
                                                    );
                                                },
                                            )}
                                            <td className="py-4 px-6 text-sm font-bold text-slate-800 text-right bg-blue-50/30 group-hover:bg-blue-50/70 transition-colors">
                                                {formatCurrency(
                                                    calculateTotalAnualCategory(
                                                        cat,
                                                    ),
                                                )}
                                            </td>
                                        </tr>

                                        {isExpanded &&
                                            catData.subCategories.map((sub) => (
                                                <tr
                                                    key={sub.id}
                                                    className="group/sub hover:bg-slate-50 transition-colors bg-slate-50/50"
                                                >
                                                    <td className="py-2 px-6 pl-10 text-sm text-slate-600 border-r border-slate-50 bg-[#F8FAFC] group-hover/sub:bg-slate-100 sticky left-0 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] z-10 w-64">
                                                        <div className="flex items-center justify-between text-slate-500 font-medium w-full">
                                                            <div className="flex items-center overflow-hidden mr-2">
                                                                <CornerDownRight className="w-4 h-4 mr-2 shrink-0" />
                                                                <span
                                                                    className="truncate"
                                                                    title={
                                                                        sub.name
                                                                    }
                                                                >
                                                                    {sub.name}
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center opacity-0 group-hover/sub:opacity-100 transition-opacity shrink-0 space-x-1">
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        openSubCatModal(
                                                                            cat,
                                                                            sub.id,
                                                                            sub.name,
                                                                        );
                                                                    }}
                                                                    className="p-1 hover:bg-blue-100 hover:text-blue-600 rounded text-slate-400 transition-colors"
                                                                    title="Renomear"
                                                                >
                                                                    <Edit2 className="w-3.5 h-3.5" />
                                                                </button>
                                                                <button
                                                                    onClick={(
                                                                        e,
                                                                    ) => {
                                                                        e.stopPropagation();
                                                                        requestDeleteSubCategory(
                                                                            cat,
                                                                            sub.id,
                                                                        );
                                                                    }}
                                                                    className="p-1 hover:bg-red-100 hover:text-red-600 rounded text-slate-400 transition-colors"
                                                                    title="Excluir"
                                                                >
                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    {sub.values.map((v, i) => (
                                                        <td
                                                            key={i}
                                                            className="py-2 px-2 text-sm text-slate-500 text-right group/cell relative"
                                                        >
                                                            <div className="flex items-center justify-end">
                                                                <button
                                                                    onClick={() =>
                                                                        handleRepeatSubValue(
                                                                            cat,
                                                                            sub.id,
                                                                            v ||
                                                                                0,
                                                                        )
                                                                    }
                                                                    className="mr-1 opacity-0 group-hover/cell:opacity-100 p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                                                                    title="Repetir valor para todos os meses"
                                                                >
                                                                    <Copy className="w-3.5 h-3.5" />
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    value={
                                                                        v || ""
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        handleSubValueChange(
                                                                            cat,
                                                                            sub.id,
                                                                            i,
                                                                            Number(
                                                                                e
                                                                                    .target
                                                                                    .value,
                                                                            ) ||
                                                                                0,
                                                                        )
                                                                    }
                                                                    className="w-20 md:w-24 bg-transparent outline-none border border-transparent hover:border-slate-300 focus:border-blue-500 rounded p-1 text-right transition-colors"
                                                                />
                                                            </div>
                                                        </td>
                                                    ))}
                                                    <td className="py-3 px-6 text-sm font-semibold text-slate-700 text-right bg-blue-50/10">
                                                        {formatCurrency(
                                                            calculateTotalAnualSubCat(
                                                                sub,
                                                            ),
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-slate-800 text-white">
                                <td className="py-4 px-6 text-sm font-bold sticky left-0 bg-slate-800 z-10 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.2)]">
                                    Total Mensal
                                </td>
                                {Array.from({ length: 12 }).map((_, idx) => {
                                    const totalMes = CATEGORIAS.reduce(
                                        (acc, cat) => {
                                            if (!data[cat]) return acc;
                                            return (
                                                acc +
                                                data[cat].baseValues[idx] +
                                                data[cat].subCategories.reduce(
                                                    (subAcc, sub) =>
                                                        subAcc +
                                                        sub.values[idx],
                                                    0,
                                                )
                                            );
                                        },
                                        0,
                                    );
                                    return (
                                        <td
                                            key={idx}
                                            className="py-4 px-4 text-sm font-bold text-right text-slate-200"
                                        >
                                            {formatCurrency(totalMes)}
                                        </td>
                                    );
                                })}
                                <td className="py-4 px-6 text-sm font-black text-right text-white">
                                    {formatCurrency(totalGeralAno)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Custom Modal for Subcategories */}
            {isSubCatModalOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800">
                                {activeEditSubId
                                    ? "Renomear Subcategoria"
                                    : "Nova Subcategoria"}
                            </h3>
                            <button
                                onClick={() => setIsSubCatModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-lg hover:bg-slate-100"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={confirmAddSubCategory}>
                            <div className="px-6 py-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Categoria Pai:{" "}
                                        <span className="font-bold text-blue-600">
                                            {activeParentCat}
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        autoFocus
                                        value={newSubCatName}
                                        onChange={(e) =>
                                            setNewSubCatName(e.target.value)
                                        }
                                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                                        placeholder="Ex: Combustível, Internet, etc..."
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsSubCatModalOpen(false)}
                                    className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={!newSubCatName.trim()}
                                    className="px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                >
                                    {activeEditSubId
                                        ? "Salvar Alteração"
                                        : "Adicionar"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Custom Modal for Delete Confirmation */}
            {deleteConfirmData && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-slate-100">
                            <h3 className="font-bold text-slate-800 text-lg">
                                Confirmar Exclusão
                            </h3>
                        </div>
                        <div className="px-6 py-5">
                            <p className="text-slate-600">
                                Tem certeza que deseja excluir esta
                                subcategoria? Os valores registrados nela serão
                                perdidos.
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                                (Lembre-se de salvar as alterações na tela
                                principal após excluir)
                            </p>
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setDeleteConfirmData(null)}
                                className="px-5 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteSubCategory}
                                className="px-6 py-2 text-sm font-bold text-white bg-red-600 rounded-xl hover:bg-red-700 active:bg-red-800 transition-all shadow-sm"
                            >
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <LoadingOverlay isVisible={isSaving} text="Salvando dashboard..." />
            <LoadingOverlay isVisible={isLoading} text="Carregando dados..." />
        </div>
    );
}
