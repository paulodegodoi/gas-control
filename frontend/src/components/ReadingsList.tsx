import type { Apartment } from '../types';

export type CurrentReadingData = {
	apartment: Apartment;
	previousReading: number;
	currentReadingDisplay: string;
	consumo: number;
};

type ReadingsListProps = {
	selectedMonth: string;	
	currentReadingsData: CurrentReadingData[];
	readingsInEdit: Record<string, string>;
	effectivePrice: number;
	onUpdateReadingInput: (apartmentId: string, valueStr: string) => void;
	readOnly?: boolean;
};

export default function ReadingsList({
	selectedMonth,
	currentReadingsData,
	readingsInEdit,
	effectivePrice,
	onUpdateReadingInput,
	readOnly
}: ReadingsListProps) {
	return (
		<div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
			<div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
				<h2 className="text-xl font-semibold text-slate-800">Leituras de {selectedMonth}</h2>
			</div>
			<div className="divide-y divide-slate-100">
				{currentReadingsData.length === 0 ? (
					<div className="p-8 text-center text-slate-500">Nenhum apartamento ativo para registro.</div>
				) : (
					currentReadingsData.map(({ apartment, previousReading, currentReadingDisplay, consumo }) => (
						<div key={apartment.id} className="p-4 flex flex-col lg:flex-row items-center justify-between hover:bg-slate-50 transition-colors">
							<div className="flex items-center space-x-4 mb-4 lg:mb-0 w-full lg:w-auto">
								<div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shrink-0">
									{apartment.number}
								</div>
								<div>
									<p className="font-semibold text-slate-800">Apt {apartment.number} <span className="text-slate-400 font-normal ml-1">({apartment.name})</span></p>
									<p className="text-xs text-slate-500">Leitura Anterior: <span className="font-medium text-slate-700">{previousReading} m³</span></p>
								</div>
							</div>

							<div className="flex items-center space-x-4 lg:space-x-8 w-full lg:w-auto justify-end">
								<div className="flex flex-col items-end">
									<label className="text-xs text-slate-500 mb-1 font-medium whitespace-nowrap">Leitura Atual (m³)</label>
									{readOnly ? (
										<div className="w-28 text-right bg-white border border-slate-200 text-slate-800 rounded-lg px-3 py-2 transition-all font-semibold select-none cursor-default">
											{currentReadingDisplay}
										</div>
									) : (
										<input
											type="number"
											step="0.01"
											value={currentReadingDisplay}
											onChange={(e) => onUpdateReadingInput(apartment.id, e.target.value)}
											onFocus={(e) => e.target.select()}
											className={`w-28 text-right border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold ${readingsInEdit[apartment.id] !== undefined ? 'bg-yellow-50 border-yellow-300 text-yellow-900' : 'bg-white border-slate-200 text-slate-800'}`}
										/>
									)}
								</div>
								<div className="w-24 text-right">
									<span className="text-xs text-slate-500 font-medium block whitespace-nowrap">Consumo</span>
									<span className={`text-lg font-bold ${consumo > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
										{consumo > 0 ? consumo.toFixed(2) : '0.00'}
									</span>
								</div>
								<div className="w-32 text-right bg-slate-50 p-2 rounded-lg border border-slate-100 shrink-0">
									<span className="text-xs text-slate-500 font-medium block whitespace-nowrap">A Pagar</span>
									<span className={`text-lg font-bold ${consumo > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
										R$ {consumo > 0 ? (consumo * effectivePrice).toFixed(2) : '0.00'}
									</span>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		</div>
	);
}
