'use client';
import { useState, useRef } from 'react';
import { Plus, Search, Filter, UploadCloud, Loader2 } from 'lucide-react';
import { Transaction } from '@/types/finance';

import { TransactionTable } from '../transactions/TransactionTable';
import { TransactionForm } from '../transactions/TransactionForm';

export const TransactionManager = () => {
  // --- ESTADO GLOBAL (Simulación DB) ---
  const [transactions, setTransactions] = useState<Transaction[]>([
    { 
      id: '1', date: '2026-02-01', description: 'Retainer Cliente Alpha', category: 'Sumadots - Retainer', type: 'income',
      originalAmount: 3300000, originalCurrency: 'CLP', exchangeRate: 0.00105, amountUSD: 3465 
    },
    { 
      id: '2', date: '2026-02-03', description: 'Alquiler Curitiba', category: 'Vivienda', type: 'expense',
      originalAmount: 4000, originalCurrency: 'BRL', exchangeRate: 0.185, amountUSD: 740 
    },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ACTIONS ---
  const handleSave = (data: Partial<Transaction>) => {
    if (editingItem) {
      setTransactions(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...data } as Transaction : t));
    } else {
      const newTx = { ...data, id: Date.now().toString() } as Transaction;
      setTransactions(prev => [...prev, newTx]);
    }
    setEditingItem(null);
  };

  const handleEdit = (item: Transaction) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Eliminar transacción?')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  // --- FUNCIÓN DE DEDUPLICACIÓN ---
  // Verifica si ya existe una transacción con misma fecha, monto y descripción similar
  const isDuplicate = (newTx: Transaction, currentList: Transaction[]) => {
    return currentList.some(existing => 
      existing.date === newTx.date &&
      Math.abs(existing.originalAmount - newTx.originalAmount) < 0.01 && // Tolerancia mínima por decimales
      existing.description.toLowerCase().trim() === newTx.description.toLowerCase().trim()
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    
    // Simulación de IA / API
    setTimeout(() => {
      const mockDataFromAI: Transaction[] = [
         // Caso 1: Duplicado (simulamos que viene el Uber que ya insertamos antes)
         { 
           id: 'temp_1', date: '2026-02-10', description: 'Uber *Trip - Autoimportado', 
           category: 'Movilidad', type: 'expense',
           originalAmount: 25.50, originalCurrency: 'BRL', exchangeRate: 0.185, amountUSD: 4.71
         },
         // Caso 2: Nuevo
         { 
           id: 'temp_2', date: '2026-02-15', description: 'Compra Supermercado Detectada', 
           category: 'Supermercado', type: 'expense',
           originalAmount: 150.00, originalCurrency: 'BRL', exchangeRate: 0.185, amountUSD: 27.75
         }
      ];

      // FILTRAR DUPLICADOS
      const newUniqueTransactions = mockDataFromAI.filter(newTx => {
        const exists = isDuplicate(newTx, transactions);
        if (exists) console.log(`[Duplicado omitido] ${newTx.description}`);
        return !exists;
      });

      // AGREGAR SOLO LOS NUEVOS
      if (newUniqueTransactions.length > 0) {
          const finalTransactions = newUniqueTransactions.map(t => ({
              ...t, 
              // Generar ID real único
              id: Date.now().toString() + Math.floor(Math.random() * 1000)
          }));
          
          setTransactions(prev => [...prev, ...finalTransactions]);
          alert(`✅ Se importaron ${finalTransactions.length} movimientos nuevos.`);
      } else {
          alert("⚠️ No se encontraron movimientos nuevos (todos ya existían).");
      }

      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Limpiar input
    }, 2000);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden h-full flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">Gestión de Movimientos</h2>
          <p className="text-sm text-slate-400">Normalización automática a USD</p>
        </div>
        
        <div className="flex gap-3 w-full xl:w-auto">
          <div className="relative">
             <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
             <button 
               onClick={() => fileInputRef.current?.click()} 
               disabled={isUploading}
               className={`h-full px-5 py-3 rounded-xl font-bold flex items-center gap-2 border shadow-sm transition-all ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
             >
               {isUploading ? <Loader2 size={18} className="animate-spin"/> : <UploadCloud size={18}/>}
               {isUploading ? 'Procesando...' : 'Subir Cartola'}
             </button>
          </div>
          
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
            className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>
      </div>

      {/* FILTROS */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Buscar..." className="w-full bg-slate-50 rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 ring-slate-200 transition-all" />
        </div>
        <button className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100"><Filter size={18}/></button>
      </div>

      <TransactionTable 
        transactions={transactions} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />
      
      <TransactionForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSave} 
        initialData={editingItem} 
      />
    </div>
  );
};