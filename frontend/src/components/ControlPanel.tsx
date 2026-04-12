import React, { useState, useEffect, useMemo, useCallback } from 'react';
import type { Apartment, Reading } from '../types';
import ControlHeader from './ControlHeader';
import SummaryCards from './SummaryCards';
import ReadingsList, { type CurrentReadingData } from './ReadingsList';
import { useAuth } from '../context/AuthContext';


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

type ControlPanelProps = {
    moduleName: 'gas' | 'water';
    apartments: Apartment[];
};

export default function ControlPanel({ moduleName, apartments }: ControlPanelProps) {
	const [currentMonthReadings, setCurrentMonthReadings] = useState<Reading[]>([]);
	const [previousMonthReadings, setPreviousMonthReadings] = useState<Reading[]>([]);
	const { token, user, activeCondominiumId } = useAuth();
	
	const [selectedMonth, setSelectedMonth] = useState<string>(() => {
		const saved = localStorage.getItem(`${moduleName}Control_selectedMonth`);
		if (saved) return saved;
		const today = new Date();
		const year = today.getFullYear();
		const month = (today.getMonth() + 1).toString().padStart(2, '0');
		return `${year}-${month}`;
	});
	
	const [price, setPrice] = useState<number>(0);
	const [priceInEdit, setPriceInEdit] = useState<string | null>(null);

	// Bulk editing readings
	const [readingsInEdit, setReadingsInEdit] = useState<Record<string, string>>({});
	const [isDirty, setIsDirty] = useState(false);

    const priceApiUrl = moduleName === 'gas' ? 'gasprices' : 'waterprices';
    const readingsApiUrl = moduleName === 'gas' ? 'gas/readings' : 'water/readings';

	useEffect(() => {
		localStorage.setItem(`${moduleName}Control_selectedMonth`, selectedMonth);
	}, [selectedMonth, moduleName]);

	const fetchReadingsForMonth = useCallback(async (month: string) => {
		if (!month || !token) return [];
		try {
			const res = await fetch(`${API_BASE}/api/${readingsApiUrl}?month=${month}`, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok) return await res.json();
		} catch (e) { console.error('Erro ao buscar leituras', e); }
		return [];
	}, [readingsApiUrl, token]);

	const loadMonthData = useCallback(async () => {
		const prevMonth = getPreviousMonth(selectedMonth);

		const [current, prev] = await Promise.all([
			fetchReadingsForMonth(selectedMonth),
			fetchReadingsForMonth(prevMonth)
		]);

		setCurrentMonthReadings(current || []);
		setPreviousMonthReadings(prev || []);
		setReadingsInEdit({});
		setPriceInEdit(null);
		setIsDirty(false);
	}, [selectedMonth, fetchReadingsForMonth]);

	const fetchPrice = useCallback(async (month: string) => {
		if (!token) return;
		try {
            const url = `${API_BASE}/api/${priceApiUrl}/${month}` + (activeCondominiumId ? `?condominiumId=${activeCondominiumId}` : '');
            const res = await fetch(url, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
            if (res.ok) {
                const data = await res.json();
                setPrice(data.pricePerCubicMeter);
            } else {
                setPrice(0);
            }
        } catch {
            setPrice(0);
        }
	}, [priceApiUrl, token, activeCondominiumId]);

	useEffect(() => {
		const loadData = async () => {
			await loadMonthData();
			await fetchPrice(selectedMonth);
		};
		loadData();
	}, [selectedMonth, loadMonthData, fetchPrice, moduleName]);

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

	const handleUpdateReadingInput = (apartmentId: string, valueStr: string) => {
		setReadingsInEdit(prev => ({ ...prev, [apartmentId]: valueStr }));
		setIsDirty(true);
	};

	const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setPriceInEdit(e.target.value);
		setIsDirty(true);
	};

	const saveAllEdits = async () => {
		if (!isDirty || !token) return;

		if (priceInEdit !== null) {
			const num = parseFloat(priceInEdit);
			if (!isNaN(num)) {
				await savePrice(num);
			}
			setPriceInEdit(null);
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
			if (priceInEdit === null) {
				setIsDirty(false);
			} else {
				setIsDirty(false);
			}
			return;
		}

		try {
            const res = await fetch(`${API_BASE}/api/${readingsApiUrl}/bulk`, {
                method: 'POST',
                headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
                body: JSON.stringify(requests)
            });

            if (res.ok) {
                await loadMonthData(); 
            }
        } catch (e) { console.error(e); }
	};

	const savePrice = async (newPrice: number) => {
        try {
            const res = await fetch(`${API_BASE}/api/${priceApiUrl}`, {
                method: 'POST',
                headers: { 
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${token}`
				},
                body: JSON.stringify({ month: selectedMonth, pricePerCubicMeter: newPrice, condominiumId: activeCondominiumId })
            });
            if (res.ok) {
                const updated = await res.json();
                setPrice(updated.pricePerCubicMeter);
            }
        } catch (e) { console.error(e); }
	};

	const currentReadingsData = useMemo<CurrentReadingData[]>(() => {
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

	const { totalConsumption, totalToPay, effectivePrice } = useMemo(() => {
		let cons = 0;
		let pay = 0;
		const overridePrice = priceInEdit !== null ? (parseFloat(priceInEdit) || 0) : price;

		currentReadingsData.forEach(d => {
			cons += d.consumo;
			pay += (d.consumo * overridePrice);
		});
		return { totalConsumption: cons, totalToPay: pay, effectivePrice: overridePrice };
	}, [currentReadingsData, price, priceInEdit]);

	return (
        <div className="space-y-6">
            <ControlHeader 
                title={moduleName === 'gas' ? 'Gas Control 🏢' : 'Water Control 🏢'}
                subtitle={moduleName === 'gas' ? 'Sistema de gestão de consumo de gás' : 'Sistema de gestão de consumo de água'}
                price={price}
                priceInEdit={priceInEdit}
                selectedMonth={selectedMonth}
                onPriceChange={handlePriceChange}
                onMonthChange={setSelectedMonth}
				readOnlyPrice={user?.role === 'Morador'}
            />

            <SummaryCards 
                totalConsumption={totalConsumption}
                totalToPay={totalToPay}
                isDirty={isDirty}
                onSave={saveAllEdits}
				hideSaveButton={user?.role === 'Morador'}
            />

            <ReadingsList 
                selectedMonth={selectedMonth}
                currentReadingsData={currentReadingsData}
                readingsInEdit={readingsInEdit}
                effectivePrice={effectivePrice}
                onUpdateReadingInput={handleUpdateReadingInput}
				readOnly={user?.role === 'Morador'}
            />
        </div>
	);
}
