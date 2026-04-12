import React from 'react';

type ControlHeaderProps = {
	title: string;
	subtitle: string;
	price: number;
	priceInEdit: string | null;
	selectedMonth: string;
	onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onMonthChange: (month: string) => void;
};

export default function ControlHeader({
	title,
	subtitle,
	price,
	priceInEdit,
	selectedMonth,
	onPriceChange,
	onMonthChange,
}: ControlHeaderProps) {
	return (
		<header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
			<div>
				<h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
				<p className="text-slate-500 mt-1">{subtitle}</p>
			</div>
			<div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
				<div className="flex items-center space-x-2">
					<span className="text-sm font-medium text-slate-500 ml-2">Preço do m³ (R$):</span>
					<input
						type="number"
						step="0.01"
						value={priceInEdit !== null ? priceInEdit : (price || '')}
						onChange={onPriceChange}
						className={`w-28 bg-white border rounded-lg px-3 py-2 font-medium outline-none focus:ring-2 transition-all ${
							priceInEdit !== null
								? 'bg-yellow-50 border-yellow-300 text-yellow-900 focus:ring-yellow-500'
								: 'border-slate-200 text-slate-700 focus:ring-primary-500'
						}`}
					/>
				</div>
				<div className="hidden sm:block w-px h-6 bg-slate-200"></div>
				<div className="flex items-center space-x-2">
					<span className="text-sm font-medium text-slate-500 ml-2 sm:ml-0">Mês de Referência:</span>
					<input
						type="month"
						value={selectedMonth}
						onChange={(e) => onMonthChange(e.target.value)}
						className="bg-white border border-slate-200 rounded-lg px-4 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
					/>
				</div>
			</div>
		</header>
	);
}
