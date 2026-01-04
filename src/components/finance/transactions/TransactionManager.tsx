'use client';
import { useState, useRef } from 'react';
import { Plus, Search, Filter, UploadCloud, Loader2 } from 'lucide-react';
import { Transaction } from '@/types/finance';

// --- IMPORTANTE: Aquí importamos los componentes modularizados ---
import { TransactionTable } from './TransactionTable';
import { TransactionForm } from './TransactionForm';

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
  
  // Estado para subida de archivos (IA)
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- ACTIONS (Lógica de Negocio) ---
  const handleSave = (data: Partial<Transaction>) => {
    if (editingItem) {
      // Editar existente
      setTransactions(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...data } as Transaction : t));
    } else {
      // Crear nuevo
      const newTx = { ...data, id: Date.now().toString() } as Transaction;
      setTransactions(prev => [...prev, newTx]);
    }
    setEditingItem(null); // Limpiar selección
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    
    // Simulación IA
    setTimeout(() => {
      const mockData: Transaction[] = [{ 
         id: Date.now().toString(), date: '2026-02-10', description: 'Uber *Trip - Autoimportado', category: 'Movilidad', type: 'expense',
         originalAmount: 25.50, originalCurrency: 'BRL', exchangeRate: 0.185, amountUSD: 4.71
      }];
      setTransactions(prev => [...prev, ...mockData]);
      setIsUploading(false);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden h-full flex flex-col">
      
      {/* HEADER Y ACCIONES */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">Gestión de Movimientos</h2>
          <p className="text-sm text-slate-400">Normalización automática a USD</p>
        </div>
        
        <div className="flex gap-3 w-full xl:w-auto">
          {/* Botón Subir Cartola */}
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
          
          {/* Botón Nueva Transacción */}
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
            className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>
      </div>

      {/* FILTROS (Visual) */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Buscar..." className="w-full bg-slate-50 rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 ring-slate-200 transition-all" />
        </div>
        <button className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100"><Filter size={18}/></button>
      </div>

      {/* TABLA (Componente Hijo) */}
      <TransactionTable 
        transactions={transactions} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />
      
      {/* FORMULARIO MODAL (Componente Hijo con Banderas) */}
      <TransactionForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSave} 
        initialData={editingItem} 
      />
    </div>
  );
};