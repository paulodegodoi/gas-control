import React, { useState, useEffect, useMemo, useCallback } from 'react';

type Apartment = {
	id: string;
	number: string;
	name: string;
	isActive: boolean;
};

type Reading = {
	id: string;
	apartmentId: string;
	month: string;
	previousReading: number;
	currentReading: number;
};

const API_BASE = import.meta.env.VITE_API_URL;

function getPreviousMonth(monthStr: string) {
	if (!monthStr) return '';
	const [yearStr, monthNumStr] = monthStr.split('-');
	let y = parseInt(yearStr, 10);
	let m = parseInt(monthNumStr, 10);
	m -= 1;
	if (m === 0) {
		m = 12;
		y -= 1;
	}
	return `${y}-${m.toString().padStart(2, '0')}`;
}

export default function App() {
	const [apartments, setApartments] = useState<Apartment[]>([]);
	const [currentMonthReadings, setCurrentMonthReadings] = useState<Reading[]>([]);
	const [previousMonthReadings, setPreviousMonthReadings] = useState<Reading[]>([]);
	
	const [selectedMonth, setSelectedMonth] = useState<string>(() => {
		const saved = localStorage.getItem('gasControl_selectedMonth');
		if (saved) return saved;
		const today = new Date();
		const year = today.getFullYear();
		const month = (today.getMonth() + 1).toString().padStart(2, '0');
		return `${year}-${month}`;
	});
	
	const [gasPrice, setGasPrice] = useState<number>(0);
	const [gasPriceInEdit, setGasPriceInEdit] = useState<string | null>(null);

	const [newAptNumber, setNewAptNumber] = useState('');
	const [newAptName, setNewAptName] = useState('');

	// Editing apartments
	const [editingAptId, setEditingAptId] = useState<string | null>(null);
	const [editNumber, setEditNumber] = useState('');
	const [editName, setEditName] = useState('');

	// Bulk editing readings
	const [readingsInEdit, setReadingsInEdit] = useState<Record<string, string>>({});
	const [isDirty, setIsDirty] = useState(false);

	useEffect(() => {
		localStorage.setItem('gasControl_selectedMonth', selectedMonth);
	}, [selectedMonth]);

	const fetchApartments = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE}/api/apartments`);
			if (res.ok) setApartments(await res.json());
		} catch (e) { console.error('Erro ao buscar apartamentos', e); }
	}, []);

	const fetchReadingsForMonth = async (month: string) => {
		if (!month) return [];
		try {
			const res = await fetch(`${API_BASE}/api/readings?month=${month}`);
			if (res.ok) return await res.json();
		} catch (e) { console.error('Erro ao buscar leituras', e); }
		return [];
	};

	const loadMonthData = useCallback(async () => {
		const prevMonth = getPreviousMonth(selectedMonth);

		const [current, prev] = await Promise.all([
			fetchReadingsForMonth(selectedMonth),
			fetchReadingsForMonth(prevMonth)
		]);

		setCurrentMonthReadings(current || []);
		setPreviousMonthReadings(prev || []);
		setReadingsInEdit({});
		setGasPriceInEdit(null);
		setIsDirty(false);
	}, [selectedMonth]);

	const fetchGasPrice = useCallback(async (month: string) => {
		const res = await fetch(`${API_BASE}/api/gasprices/${month}`);

		if (res.ok) {
			const data = await res.json();
			setGasPrice(data.pricePerCubicMeter);
		} else {
			setGasPrice(0);
		}
	}, []);

	useEffect(() => {
		const loadData = async () => {
			await fetchApartments();
		};

		loadData();
	}, [fetchApartments]);

	useEffect(() => {
		const loadData = async () => {
			await loadMonthData();
			await fetchGasPrice(selectedMonth);
		};

		loadData();
	}, [selectedMonth, loadMonthData, fetchGasPrice]);

	const activeApartments = useMemo(() => {
		return apartments
			.filter(a => a.isActive)
			.sort((a, b) => {
				const numA = parseInt(a.number) || 0;
				const numB = parseInt(b.number) || 0;
				if (numA !== numB) return numA - numB;
				return a.number.localeCompare(b.number);
			});
	}, [apartments]);

	const handleToggleActive = async (id: string, currentStatus: boolean) => {
		const res = await fetch(`${API_BASE}/api/apartments/${id}/state`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ isActive: !currentStatus })
		});
		if (res.ok) {
			const updated = await res.json();
			setApartments(prev => prev.map(a => a.id === id ? updated : a));
		}
	};

	const handleAddApartment = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!newAptNumber.trim() || !newAptName.trim()) return;
		const res = await fetch(`${API_BASE}/api/apartments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ number: newAptNumber, name: newAptName })
		});
		if (res.ok) {
			const created = await res.json();
			setApartments(prev => [...prev, created]);
			setNewAptNumber('');
			setNewAptName('');
		}
	};

	const startEditing = (apt: Apartment) => {
		setEditingAptId(apt.id);
		setEditNumber(apt.number);
		setEditName(apt.name);
	};

	const saveEdit = async () => {
		if (!editingAptId) return;
		const res = await fetch(`${API_BASE}/api/apartments/${editingAptId}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ number: editNumber, name: editName })
		});
		if (res.ok) {
			const updated = await res.json();
			setApartments(prev => prev.map(a => a.id === editingAptId ? updated : a));
			setEditingAptId(null);
		}
	};

	const handleUpdateReadingInput = (apartmentId: string, valueStr: string) => {
		setReadingsInEdit(prev => ({ ...prev, [apartmentId]: valueStr }));
		setIsDirty(true);
	};

	const handleGasPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setGasPriceInEdit(e.target.value);
		setIsDirty(true);
	};

	const saveAllEdits = async () => {
		if (!isDirty) return;

		if (gasPriceInEdit !== null) {
			const num = parseFloat(gasPriceInEdit);
			if (!isNaN(num)) {
				await saveGasPrice(num);
			}
			setGasPriceInEdit(null);
		}

		const requests = Object.entries(readingsInEdit).map(([aptId, valStr]) => {
			const val = parseFloat(valStr);
			return {
				apartmentId: aptId,
				month: selectedMonth,
				previousReading: 0,
				currentReading: isNaN(val) ? 0 : val
			};
		});

		if (requests.length === 0) {
			if (gasPriceInEdit === null) {
				setIsDirty(false);
			} else {
				// We only saved gas price. Refresh totals and clear dirty.
				setIsDirty(false);
			}
			return;
		}

		const res = await fetch(`${API_BASE}/api/readings/bulk`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(requests)
		});

		if (res.ok) {
			await loadMonthData(); 
		}
	};

	const saveGasPrice = async (price: number) => {
		const res = await fetch(`${API_BASE}/api/gasprices`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ month: selectedMonth, pricePerCubicMeter: price })
		});
		if (res.ok) {
			const updated = await res.json();
			setGasPrice(updated.pricePerCubicMeter);
		}
	};

	const currentReadingsData = useMemo(() => {
		return activeApartments.map(apt => {
			const prevReadingObj = previousMonthReadings.find(r => r.apartmentId === apt.id);
			const currentReadingObj = currentMonthReadings.find(r => r.apartmentId === apt.id);

			const previousReading = prevReadingObj ? prevReadingObj.currentReading : 0;
			const dbCurrentReading = currentReadingObj ? currentReadingObj.currentReading : previousReading;

			const editedVal = readingsInEdit[apt.id];
			const currentReadingDisplay = editedVal !== undefined ? editedVal : dbCurrentReading.toString();

			const currentReadingNum = parseFloat(currentReadingDisplay) || 0;
			const consumo = Math.max(0, currentReadingNum - previousReading);

			return {
				apartment: apt,
				previousReading,
				currentReadingDisplay,
				consumo,
			};
		});
	}, [activeApartments, currentMonthReadings, previousMonthReadings, readingsInEdit]);

	const { totalConsumption, totalToPay, effectiveGasPrice } = useMemo(() => {
		let cons = 0;
		let pay = 0;
		const effectivePrice = gasPriceInEdit !== null ? (parseFloat(gasPriceInEdit) || 0) : gasPrice;

		currentReadingsData.forEach(d => {
			cons += d.consumo;
			pay += (d.consumo * effectivePrice);
		});
		return { totalConsumption: cons, totalToPay: pay, effectiveGasPrice: effectivePrice };
	}, [currentReadingsData, gasPrice, gasPriceInEdit]);

	return (
		<div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
			<div className="max-w-6xl mx-auto space-y-8">

				<header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
					<div>
						<h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gas Control 🏢</h1>
						<p className="text-slate-500 mt-1">Sistema de gestão de consumo de gás integrado ao Backend</p>
					</div>
					<div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
						<div className="flex items-center space-x-2">
							<span className="text-sm font-medium text-slate-500 ml-2">Preço do m³ (R$):</span>
							<input
								type="number"
								step="0.01"
								value={gasPriceInEdit !== null ? gasPriceInEdit : (gasPrice || '')}
								onChange={handleGasPriceChange}
								className={`w-28 bg-white border rounded-lg px-3 py-2 font-medium outline-none focus:ring-2 transition-all ${gasPriceInEdit !== null ? 'bg-yellow-50 border-yellow-300 text-yellow-900 focus:ring-yellow-500' : 'border-slate-200 text-slate-700 focus:ring-primary-500'}`}
							/>
						</div>
						<div className="hidden sm:block w-px h-6 bg-slate-200"></div>
						<div className="flex items-center space-x-2">
							<span className="text-sm font-medium text-slate-500 ml-2 sm:ml-0">Mês de Referência:</span>
							<input
								type="month"
								value={selectedMonth}
								onChange={(e) => setSelectedMonth(e.target.value)}
								className="bg-white border border-slate-200 rounded-lg px-4 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
							/>
						</div>
					</div>
				</header>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
					<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
						<span className="text-sm text-slate-500 font-medium">Consumo Total (m³)</span>
						<span className="text-3xl font-bold text-slate-800 mt-2">{totalConsumption.toFixed(2)}</span>
					</div>
					<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
						<span className="text-sm text-slate-500 font-medium">Valor Total a Pagar</span>
						<span className="text-3xl font-bold text-emerald-600 mt-2">R$ {totalToPay.toFixed(2)}</span>
					</div>
					<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center justify-center">
						<span className="text-sm text-slate-500 font-medium pb-2">Status de Alterações</span>
						<button 
							onClick={saveAllEdits}
							disabled={!isDirty}
							className={`w-full py-3 rounded-lg font-bold transition-all shadow-sm ${isDirty ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-200' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
						>
							{isDirty ? 'Salvar Alterações' : 'Tudo Salvo'}
						</button>
					</div>
				</div>

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2 space-y-6">
						<div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
							<div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white bg-slate-50">
								<h2 className="text-xl font-semibold text-slate-800">Leituras de {selectedMonth}</h2>
							</div>
							<div className="divide-y divide-slate-100">
								{currentReadingsData.length === 0 ? (
									<div className="p-8 text-center text-slate-500">Nenhum apartamento ativo para registro.</div>
								) : (
									currentReadingsData.map(({ apartment, previousReading, currentReadingDisplay, consumo }) => (
										<div key={apartment.id} className="p-6 flex flex-col xl:flex-row items-center justify-between hover:bg-slate-50 transition-colors">
											<div className="flex items-center space-x-4 mb-4 xl:mb-0 w-full xl:w-auto">
												<div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shrink-0">
													{apartment.number}
												</div>
												<div>
													<p className="font-semibold text-slate-800">Apt {apartment.number} <span className="text-slate-400 font-normal ml-1">({apartment.name})</span></p>
													<p className="text-xs text-slate-500">Leitura Anterior: <span className="font-medium text-slate-700">{previousReading} m³</span></p>
												</div>
											</div>

											<div className="flex items-center space-x-4 xl:space-x-6 w-full xl:w-auto justify-end">
												<div className="flex flex-col items-end">
													<label className="text-xs text-slate-500 mb-1 font-medium">Leitura Atual (m³)</label>
													<input
														type="number"
														step="0.01"
														value={currentReadingDisplay}
														onChange={(e) => handleUpdateReadingInput(apartment.id, e.target.value)}
														onFocus={(e) => e.target.select()}
														className={`w-28 text-right border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold ${readingsInEdit[apartment.id] !== undefined ? 'bg-yellow-50 border-yellow-300 text-yellow-900' : 'bg-white border-slate-200 text-slate-800'}`}
													/>
												</div>
												<div className="w-24 text-right">
													<span className="text-xs text-slate-500 font-medium block">Consumo</span>
													<span className={`text-lg font-bold ${consumo > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
														{consumo > 0 ? consumo.toFixed(2) : '0.00'}
													</span>
												</div>
												<div className="w-28 text-right bg-slate-50 p-2 rounded-lg border border-slate-100">
													<span className="text-xs text-slate-500 font-medium block">A Pagar</span>
													<span className={`text-lg font-bold ${consumo > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
														R$ {consumo > 0 ? (consumo * effectiveGasPrice).toFixed(2) : '0.00'}
													</span>
												</div>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					</div>

					<div className="space-y-6">
						<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
							<h2 className="text-xl font-semibold text-slate-800 mb-4">Apartamentos</h2>

							<form onSubmit={handleAddApartment} className="flex flex-col space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
								<h3 className="text-sm font-semibold text-slate-600">Novo Apartamento</h3>
								<div className="flex space-x-2">
									<input
										type="text"
										value={newAptNumber}
										onChange={(e) => setNewAptNumber(e.target.value)}
										placeholder="Nº"
										className="w-1/3 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
									/>
									<input
										type="text"
										value={newAptName}
										onChange={(e) => setNewAptName(e.target.value)}
										placeholder="Nome/Família"
										className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-all text-sm"
									/>
								</div>
								<button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 rounded-lg transition-colors shadow-sm text-sm">
									Adicionar
								</button>
							</form>

							<div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
								{apartments.map(apt => (
									<div key={apt.id} className="flex flex-col p-3 rounded-xl border border-slate-100 bg-slate-50 group transition-all">
										{editingAptId === apt.id ? (
											<div className="space-y-3">
												<div className="flex space-x-2">
													<input
														type="text"
														value={editNumber}
														onChange={(e) => setEditNumber(e.target.value)}
														className="w-1/3 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
													/>
													<input
														type="text"
														value={editName}
														onChange={(e) => setEditName(e.target.value)}
														className="flex-1 bg-white border border-slate-300 rounded-lg px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary-500"
													/>
												</div>
												<div className="flex space-x-2 justify-end">
													<button onClick={() => setEditingAptId(null)} className="text-xs font-semibold text-slate-500 hover:text-slate-700 px-2 py-1 rounded">Cancelar</button>
													<button onClick={saveEdit} className="text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1 rounded-md shadow-sm">Salvar</button>
												</div>
											</div>
										) : (
											<div className="flex flex-col">
												<div className="flex items-start justify-between">
													<span className={`font-semibold ${apt.isActive ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
														Apt {apt.number}
													</span>
													<button
														onClick={() => handleToggleActive(apt.id, apt.isActive)}
														className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider transition-colors ${apt.isActive
															? 'bg-rose-100 text-rose-700 hover:bg-rose-200'
															: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
															}`}
													>
														{apt.isActive ? 'Desativar' : 'Ativar'}
													</button>
												</div>
												<div className="flex items-center justify-between mt-1">
													<span className={`text-sm ${apt.isActive ? 'text-slate-600' : 'text-slate-400'}`}>{apt.name || 'Sem nome'}</span>
													<button
														onClick={() => startEditing(apt)}
														className="text-xs text-primary-600 hover:text-primary-800 font-semibold opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
													>
														Editar
													</button>
												</div>
											</div>
										)}
									</div>
								))}
							</div>
						</div>
					</div>

				</div>
			</div>
		</div>
	);
}
