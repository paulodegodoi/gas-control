import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import NavigationHeader from './components/NavigationHeader';
import ApartmentsManager from './components/ApartmentsManager';
import UsersManager from './components/UsersManager';
import ControlPanel from './components/ControlPanel';
import FinancialDashboard from './components/FinancialDashboard';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SetupPasswordPage from './pages/SetupPasswordPage';
import SelectCondominiumPage from './pages/SelectCondominiumPage';
import PrivateRoute from './components/PrivateRoute';

import type { Apartment } from './types';

const API_BASE = import.meta.env.VITE_API_URL;

function AppContent() {
	const [activeModule, setActiveModule] = useState<'gas' | 'water' | 'finance'>('gas');
    const [apartments, setApartments] = useState<Apartment[]>([]);
	const { token, user, activeCondominiumId } = useAuth();

    const fetchApartments = useCallback(async () => {
		if (!token) return;
		try {
            const url = `${API_BASE}/api/apartments` + (activeCondominiumId ? `?condominiumId=${activeCondominiumId}` : '');
			const res = await fetch(url, {
				headers: { 'Authorization': `Bearer ${token}` }
			});
			if (res.ok) setApartments(await res.json());
		} catch (e) { console.error('Erro ao buscar apartamentos', e); }
	}, [token, activeCondominiumId]);

    useEffect(() => {
		// eslint-disable-next-line react-hooks/set-state-in-effect
		fetchApartments();
	}, [fetchApartments]);

    useEffect(() => {
        if (user?.role === 'Morador' && activeModule === 'finance') {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setActiveModule('gas');
        }
    }, [user, activeModule]);

    const handleAddApartment = async (number: string, name: string) => {
		const res = await fetch(`${API_BASE}/api/apartments`, {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({ number, name, condominiumId: activeCondominiumId || null })
		});
		if (res.ok) {
			const created = await res.json();
			setApartments(prev => [...prev, created]);
		}
	};

     const handleToggleActive = async (id: string, currentStatus: boolean) => {
		const res = await fetch(`${API_BASE}/api/apartments/${id}/state`, {
			method: 'PATCH',
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
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
			headers: { 
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${token}`
			},
			body: JSON.stringify({ number, name })
		});
		if (res.ok) {
			const updated = await res.json();
			setApartments(prev => prev.map(a => a.id === id ? updated : a));
		}
	};

	if (user?.role !== 'Morador' && !activeCondominiumId) {
        return <Navigate to="/select-condominium" replace />;
    }

	return (
		<div className={`min-h-screen text-slate-800 p-6 md:p-12 font-sans transition-colors ${activeModule === 'gas' ? 'theme-gas bg-slate-50' : activeModule === 'water' ? 'theme-water bg-slate-50' : 'theme-finance bg-slate-50'}`}>
			<div className="max-w-screen-2xl mx-auto">
				<NavigationHeader activeModule={activeModule} setActiveModule={setActiveModule} />

				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					<div className={activeModule === 'finance' ? "lg:col-span-3" : "lg:col-span-2"}>
                        {activeModule === 'gas' && (
                            <ControlPanel moduleName="gas" apartments={apartments} />
                        )}
                        {activeModule === 'water' && (
                            <ControlPanel moduleName="water" apartments={apartments} />
                        )}
                        {activeModule === 'finance' && user?.role !== 'Morador' && (
                            <FinancialDashboard />
                        )}
					</div>

					{user?.role !== 'Morador' && activeModule !== 'finance' && (
						<div className="space-y-6">
							<ApartmentsManager 
								apartments={apartments}
								onAddApartment={handleAddApartment}
								onToggleActive={handleToggleActive}
								onEditApartment={handleEditApartment}
							/>
                            <UsersManager />
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<BrowserRouter>
				<Routes>
					<Route path="/login" element={<LoginPage />} />
					<Route path="/forgot-password" element={<ForgotPasswordPage />} />
					<Route path="/reset-password" element={<ResetPasswordPage />} />
					<Route path="/setup-password" element={
						<PrivateRoute>
							<SetupPasswordPage />
						</PrivateRoute>
					} />
					<Route path="/select-condominium" element={
						<PrivateRoute>
							<SelectCondominiumPage />
						</PrivateRoute>
					} />
					<Route path="/*" element={
						<PrivateRoute>
							<AppContent />
						</PrivateRoute>
					} />
				</Routes>
			</BrowserRouter>
		</AuthProvider>
	);
}
