import { useState, useEffect, useCallback } from 'react';
import NavigationHeader from './components/NavigationHeader';
import ApartmentsManager from './components/ApartmentsManager';
import ControlPanel from './components/ControlPanel';

import type { Apartment } from './types';

const API_BASE = import.meta.env.VITE_API_URL;

export default function App() {
	const [activeModule, setActiveModule] = useState<'gas' | 'water'>('gas');
    const [apartments, setApartments] = useState<Apartment[]>([]);

    const fetchApartments = useCallback(async () => {
		try {
			const res = await fetch(`${API_BASE}/api/apartments`);
			if (res.ok) setApartments(await res.json());
		} catch (e) { console.error('Erro ao buscar apartamentos', e); }
	}, []);

    useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchApartments();
	}, [fetchApartments]);

    const handleAddApartment = async (number: string, name: string) => {
		const res = await fetch(`${API_BASE}/api/apartments`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ number, name })
		});
		if (res.ok) {
			const created = await res.json();
			setApartments(prev => [...prev, created]);
		}
	};

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

    const handleEditApartment = async (id: string, number: string, name: string) => {
		const res = await fetch(`${API_BASE}/api/apartments/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ number, name })
		});
		if (res.ok) {
			const updated = await res.json();
			setApartments(prev => prev.map(a => a.id === id ? updated : a));
		}
	};

	return (
		<div className={`min-h-screen text-slate-800 p-8 font-sans transition-colors ${activeModule === 'gas' ? 'theme-gas bg-primary-50' : 'theme-water bg-primary-50'}`}>
			<div className="max-w-6xl mx-auto">
				<NavigationHeader activeModule={activeModule} setActiveModule={setActiveModule} />

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className="lg:col-span-2">
                        {activeModule === 'gas' && (
                            <ControlPanel moduleName="gas" apartments={apartments} />
                        )}
                        {activeModule === 'water' && (
                            <ControlPanel moduleName="water" apartments={apartments} />
                        )}
					</div>

					<div className="space-y-6">
                        <ApartmentsManager 
                            apartments={apartments}
                            onAddApartment={handleAddApartment}
                            onToggleActive={handleToggleActive}
                            onEditApartment={handleEditApartment}
                        />
					</div>
				</div>
			</div>
		</div>
	);
}
