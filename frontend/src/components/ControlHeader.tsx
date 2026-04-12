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
		<header className="flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-6">
			<div className="border-b border-slate-100 pb-4">
				<h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
				<p className="text-slate-500 mt-1">{subtitle}</p>
			</div>
			<div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0 md:space-x-12 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
				<div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-start">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Preço do m³</span>
						<div className="flex items-center space-x-3">
							<span className="text-sm font-semibold text-slate-500 whitespace-nowrap">R$</span>
							<input
								type="number"
								step="0.01"
								value={priceInEdit !== null ? priceInEdit : (price || '')}
								onChange={onPriceChange}
								className={`w-32 bg-white border rounded-lg px-3 py-2 font-bold outline-none focus:ring-2 transition-all ${
									priceInEdit !== null
										? 'bg-yellow-50 border-yellow-300 text-yellow-900 focus:ring-yellow-500'
										: 'border-slate-200 text-slate-700 focus:ring-primary-500'
								}`}
							/>
						</div>
					</div>
				</div>
				<div className="hidden md:block w-px h-10 bg-slate-200"></div>
				<div className="flex items-center space-x-4 w-full md:w-auto justify-between md:justify-start">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mês de Referência</span>
						<input
							type="month"
							value={selectedMonth}
							onChange={(e) => onMonthChange(e.target.value)}
							className="bg-white border border-slate-200 rounded-lg px-4 py-2 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all w-48"
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
