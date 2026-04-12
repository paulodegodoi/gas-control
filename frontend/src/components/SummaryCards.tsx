type SummaryCardsProps = {
	totalConsumption: number;
	totalToPay: number;
	isDirty: boolean;
	onSave: () => void;
	hideSaveButton?: boolean;
};

export default function SummaryCards({
	totalConsumption,
	totalToPay,
	isDirty,
	onSave,
	hideSaveButton
}: SummaryCardsProps) {
	return (
		<div className="flex flex-col sm:flex-row items-stretch gap-6 mb-8 mt-8">
			<div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
				<div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl shadow-inner border border-slate-50">📊</div>
				<div className="flex flex-col">
					<span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Consumo Total</span>
					<span className="text-3xl font-black text-slate-800">{totalConsumption.toFixed(2)} <span className="text-sm font-medium text-slate-400">m³</span></span>
				</div>
			</div>
			
			<div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center space-x-4">
				<div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-2xl shadow-inner border border-primary-50">💰</div>
				<div className="flex flex-col">
					<span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Est.</span>
					<span className="text-3xl font-black text-primary-600"><span className="text-sm">R$</span> {totalToPay.toFixed(2)}</span>
				</div>
			</div>

			{!hideSaveButton && (
				<div className="flex-1 bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center group">
					<button 
						onClick={onSave}
						disabled={!isDirty}
						className={`w-full py-4 rounded-xl font-black transition-all shadow-lg active:scale-95 ${
							isDirty 
								? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-200 ring-4 ring-primary-500/10' 
								: 'bg-slate-100 text-slate-400 cursor-not-allowed border-dashed border-2 border-slate-200 shadow-none'
						}`}
					>
						{isDirty ? '💾 SALVAR AGORA' : '✅ TUDO ATUALIZADO'}
					</button>
				</div>
			)}
		</div>
	);
}
