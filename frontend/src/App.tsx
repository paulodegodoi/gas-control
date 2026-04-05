import React, { useState, useEffect, useMemo } from 'react';

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

const API_BASE = 'http://localhost:5243/api';

export default function App() {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [readings, setReadings] = useState<Reading[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>('2023-11');
  const [newAptNumber, setNewAptNumber] = useState('');
  const [newAptName, setNewAptName] = useState('');
  
  // Editing state
  const [editingAptId, setEditingAptId] = useState<string | null>(null);
  const [editNumber, setEditNumber] = useState('');
  const [editName, setEditName] = useState('');

  const fetchApartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/apartments`);
      if (res.ok) setApartments(await res.json());
    } catch(e) { console.error('Erro ao buscar apartamentos', e); }
  };

  const fetchReadings = async () => {
    try {
      const res = await fetch(`${API_BASE}/readings/all`);
      if (res.ok) setReadings(await res.json());
    } catch(e) { console.error('Erro ao buscar leituras', e); }
  };

  useEffect(() => {
    fetchApartments();
    fetchReadings();
  }, []);

  const activeApartments = useMemo(() => apartments.filter(a => a.isActive), [apartments]);

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`${API_BASE}/apartments/${id}/state`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setApartments(prev => prev.map(a => a.id === id ? updated : a));
      }
    } catch(e) {}
  };

  const handleAddApartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAptNumber.trim() || !newAptName.trim()) return;
    
    try {
      const res = await fetch(`${API_BASE}/apartments`, {
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
    } catch(e) {}
  };

  const startEditing = (apt: Apartment) => {
    setEditingAptId(apt.id);
    setEditNumber(apt.number);
    setEditName(apt.name);
  };

  const saveEdit = async () => {
    if (!editingAptId) return;
    try {
      const res = await fetch(`${API_BASE}/apartments/${editingAptId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ number: editNumber, name: editName })
      });
      if (res.ok) {
        const updated = await res.json();
        setApartments(prev => prev.map(a => a.id === editingAptId ? updated : a));
        setEditingAptId(null);
      }
    } catch(e) {}
  };

  const currentReadings = useMemo(() => {
    return activeApartments.map(apt => {
      const existingReading = readings.find(r => r.apartmentId === apt.id && r.month === selectedMonth);
      const prevReading = readings.filter(r => r.apartmentId === apt.id && r.month < selectedMonth).sort((a,b) => b.month.localeCompare(a.month))[0];
      
      return {
        apartment: apt,
        reading: existingReading || {
          id: '',
          apartmentId: apt.id,
          month: selectedMonth,
          previousReading: prevReading ? prevReading.currentReading : 0,
          currentReading: prevReading ? prevReading.currentReading : 0,
        }
      };
    });
  }, [activeApartments, readings, selectedMonth]);

  const handleUpdateReading = async (apartmentId: string, previousReading: number, currentReadingStr: string) => {
    const val = parseFloat(currentReadingStr);
    if (isNaN(val)) return;

    try {
      const res = await fetch(`${API_BASE}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apartmentId,
          month: selectedMonth,
          previousReading: previousReading,
          currentReading: val
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setReadings(prev => {
          const newReadings = prev.filter(r => !(r.apartmentId === updated.apartmentId && r.month === updated.month));
          return [...newReadings, updated];
        });
      }
    } catch(e) {}
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Gas Control 🏢</h1>
            <p className="text-slate-500 mt-1">Sistema de gestão de consumo de gás integrado ao Backend</p>
          </div>
          <div className="flex items-center space-x-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
            <span className="text-sm font-medium text-slate-500 ml-2">Mês de Referência:</span>
            <input 
              type="month" 
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-4 py-2 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white">
                <h2 className="text-xl font-semibold text-slate-800">Leituras de {selectedMonth}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {currentReadings.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">Nenhum apartamento ativo para registro.</div>
                ) : (
                  currentReadings.map(({ apartment, reading }) => {
                    const consumo = reading.currentReading - reading.previousReading;
                    return (
                      <div key={apartment.id} className="p-6 flex flex-col sm:flex-row items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="flex items-center space-x-4 mb-4 sm:mb-0">
                          <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-lg shrink-0">
                            {apartment.number}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">Apt {apartment.number} <span className="text-slate-400 font-normal ml-1">({apartment.name})</span></p>
                            <p className="text-xs text-slate-500">Leitura Anterior: <span className="font-medium text-slate-700">{reading.previousReading} m³</span></p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="flex flex-col items-end">
                            <label className="text-xs text-slate-500 mb-1 font-medium">Leitura Atual (m³)</label>
                            <input 
                              type="number" 
                              value={reading.currentReading || ''}
                              onChange={(e) => handleUpdateReading(apartment.id, reading.previousReading, e.target.value)}
                              className="w-24 text-right bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 transition-all font-semibold"
                            />
                          </div>
                          <div className="w-24 text-right">
                            <span className="text-xs text-slate-500 font-medium block">Consumo</span>
                            <span className={`text-lg font-bold ${consumo > 0 ? 'text-primary-600' : 'text-slate-400'}`}>
                              {consumo > 0 ? consumo.toFixed(2) : '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })
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

              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
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
                            className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider transition-colors ${
                              apt.isActive 
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
