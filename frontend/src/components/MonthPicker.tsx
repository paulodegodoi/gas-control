import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface MonthPickerProps {
    value: string; // YYYY-MM format
    onChange: (value: string) => void;
}

const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function MonthPicker({ value, onChange }: MonthPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => {
        if (value) {
            const [y] = value.split('-');
            return parseInt(y, 10);
        }
        return new Date().getFullYear();
    });

    const displayDate = () => {
        if (!value) return 'Selecione um mês';
        const [y, m] = value.split('-');
        const monthName = MONTHS[parseInt(m, 10) - 1];
        return `${monthName} de ${y}`;
    };

    const handleSelectMonth = (monthIndex: number) => {
        const mm = (monthIndex + 1).toString().padStart(2, '0');
        onChange(`${viewYear}-${mm}`);
        setIsOpen(false);
    };

    return (
        <div className="relative w-full">
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-transparent border-b-2 border-transparent hover:border-slate-300 px-1 py-1 text-lg font-bold text-slate-700 outline-none transition-all group"
            >
                <div className="flex items-center">
                    {displayDate()}
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50">
                            <button
                                type="button"
                                onClick={() => setViewYear(y => y - 1)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="font-bold text-slate-700">{viewYear}</span>
                            <button
                                type="button"
                                onClick={() => setViewYear(y => y + 1)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 p-3">
                            {MONTHS.map((month, idx) => {
                                const isSelected = value === `${viewYear}-${(idx + 1).toString().padStart(2, '0')}`;
                                return (
                                    <button
                                        key={month}
                                        type="button"
                                        onClick={() => handleSelectMonth(idx)}
                                        className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors ${
                                            isSelected
                                                ? 'bg-blue-600 text-white shadow-sm'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {month.substring(0, 3)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
