import { useState } from "react";
import FinanceDashboardView from "./FinanceDashboardView";
import type { FinanceCategoryType } from "../types";

export default function FinancialDashboard() {
    const [activeTab, setActiveTab] = useState<FinanceCategoryType>("Realized");

    return (
        <div className="space-y-6">
            {/* Tabs Navigation */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab("Realized")}
                        className={`${
                            activeTab === "Realized"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
                    >
                        Acompanhamento Mensal
                    </button>
                    <button
                        onClick={() => setActiveTab("Forecast")}
                        className={`${
                            activeTab === "Forecast"
                                ? "border-blue-500 text-blue-600"
                                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        } whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors`}
                    >
                        Previsão Orçamentária
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === "Realized" ? (
                    <FinanceDashboardView
                        type="Realized"
                        title="Acompanhamento Mensal 📈"
                        subtitle="Acompanhamento de despesas realizadas mês a mês"
                    />
                ) : (
                    <FinanceDashboardView
                        type="Forecast"
                        title="Previsão Orçamentária 📊"
                        subtitle="Acompanhamento e previsão de despesas anual"
                    />
                )}
            </div>
        </div>
    );
}
