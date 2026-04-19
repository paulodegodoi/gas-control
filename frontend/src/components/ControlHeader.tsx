import React from 'react';
import MonthPicker from './MonthPicker';

type ControlHeaderProps = {
	title: string;
	subtitle: string;
	price: number;
	priceInEdit: string | null;
	selectedMonth: string;
	onPriceChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onMonthChange: (month: string) => void;
	readOnlyPrice?: boolean;
};

export default function ControlHeader({
	title,
	subtitle,
	price,
	priceInEdit,
	selectedMonth,
	onPriceChange,
	onMonthChange,
	readOnlyPrice
}: ControlHeaderProps) {
	return (
		<header className="flex flex-col bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-6">
			<div className="border-b border-slate-100 pb-4">
				<h1 className="text-3xl font-bold text-slate-900 tracking-tight">{title}</h1>
				<p className="text-slate-500 mt-1">{subtitle}</p>
			</div>
			<div className="flex flex-col md:flex-row items-stretch justify-between gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
				<div className="flex-1 flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100">
					<div className="flex flex-col">
						<span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Preço do m³</span>
						<div className="flex items-center space-x-3">
							<span className="text-sm font-semibold text-slate-500 whitespace-nowrap">R$</span>
							{readOnlyPrice ? (
								<div className="text-lg font-bold text-slate-700">
									{price ? parseFloat(price.toString()).toFixed(2) : '0.00'}
								</div>
							) : (
								<input
									type="number"
									step="0.01"
									value={priceInEdit !== null ? priceInEdit : (price || '')}
									onChange={onPriceChange}
									className={`w-full max-w-[200px] bg-white border-b-2 border-transparent px-1 py-1 text-lg font-bold outline-none transition-all ${
										priceInEdit !== null
											? 'text-yellow-600 border-yellow-400'
											: 'text-slate-700 focus:border-primary-500'
									}`}
								/>
							)}
						</div>
					</div>
				</div>

				<div className="flex-1 flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100">
					<div className="flex flex-col w-full">
						<span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Mês de Referência</span>
						<MonthPicker 
							value={selectedMonth}
							onChange={onMonthChange}
						/>
					</div>
				</div>
			</div>
		</header>
	);
}
