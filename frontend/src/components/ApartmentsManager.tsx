import React, { useState } from 'react';
import type { Apartment } from '../types';

type ApartmentsManagerProps = {
    apartments: Apartment[];
    onAddApartment: (number: string, name: string) => Promise<void>;
    onToggleActive: (id: string, currentStatus: boolean) => Promise<void>;
    onEditApartment: (id: string, number: string, name: string) => Promise<void>;
};

export default function ApartmentsManager({
    apartments,
    onAddApartment,
    onToggleActive,
    onEditApartment,
}: ApartmentsManagerProps) {
	const [newAptNumber, setNewAptNumber] = useState('');
	const [newAptName, setNewAptName] = useState('');

	const [editingAptId, setEditingAptId] = useState<string | null>(null);
	const [editNumber, setEditNumber] = useState('');
	const [editName, setEditName] = useState('');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newAptNumber.trim() || !newAptName.trim()) return;
        await onAddApartment(newAptNumber, newAptName);
        setNewAptNumber('');
        setNewAptName('');
    }

    const startEditing = (apt: Apartment) => {
		setEditingAptId(apt.id);
		setEditNumber(apt.number);
		setEditName(apt.name);
	};

	const saveEdit = async () => {
		if (!editingAptId) return;
        await onEditApartment(editingAptId, editNumber, editName);
        setEditingAptId(null);
	};

	return (
		<div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
			<h2 className="text-xl font-semibold text-slate-800 mb-4">Apartamentos</h2>

			<form onSubmit={handleAdd} className="flex flex-col space-y-3 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
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
										onClick={() => onToggleActive(apt.id, apt.isActive)}
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
	);
}
