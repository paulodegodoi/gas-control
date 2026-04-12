import React from 'react';

type SummaryCardsProps = {
	totalConsumption: number;
	totalToPay: number;
	isDirty: boolean;
	onSave: () => void;
};

export default function SummaryCards({
	totalConsumption,
	totalToPay,
	isDirty,
	onSave,
}: SummaryCardsProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 mt-8">
			<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
				<span className="text-sm text-slate-500 font-medium">Consumo Total (m³)</span>
				<span className="text-3xl font-bold text-slate-800 mt-2">{totalConsumption.toFixed(2)}</span>
			</div>
			<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
				<span className="text-sm text-slate-500 font-medium">Valor Total a Pagar</span>
				<span className="text-3xl font-bold text-primary-600 mt-2">R$ {totalToPay.toFixed(2)}</span>
			</div>
			<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
				<span className="text-sm text-slate-500 font-medium pb-2">Status de Alterações</span>
				<button 
					onClick={onSave}
					disabled={!isDirty}
					className={`w-full py-3 rounded-lg font-bold transition-all shadow-sm ${
						isDirty 
							? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-200' 
							: 'bg-slate-100 text-slate-400 cursor-not-allowed'
					}`}
				>
					{isDirty ? 'Salvar Alterações' : 'Tudo Salvo'}
				</button>
			</div>
		</div>
	);
}
