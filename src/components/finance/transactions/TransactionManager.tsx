'use client';
import { useState, useMemo } from 'react';
import { Plus, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { TransactionTable } from './TransactionTable';
import { TransactionForm } from './TransactionForm';

interface TransactionManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

export const TransactionManager = ({ transactions, setTransactions }: TransactionManagerProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  
  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const paginatedTransactions = useMemo(() => {
    // 1. Ordenar por fecha (descendente: más nuevo primero)
    const sorted = [...transactions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    
    // 2. Calcular slice
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    
    return sorted.slice(indexOfFirstItem, indexOfLastItem);
  }, [transactions, currentPage]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage);

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

  return (
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 overflow-hidden h-full flex flex-col">
      
      {/* HEADER */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-black text-slate-800">Gestión de Movimientos</h2>
          <p className="text-sm text-slate-400">
            Total Registros: {transactions.length} | Página {currentPage} de {totalPages || 1}
          </p>
        </div>
        
        <div className="flex gap-3 w-full xl:w-auto">
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
            className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg active:scale-95 transition-all"
          >
            <Plus size={18} /> <span className="hidden sm:inline">Nueva</span>
          </button>
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input type="text" placeholder="Buscar..." className="w-full bg-slate-50 rounded-xl py-2 pl-10 pr-4 text-sm font-medium outline-none focus:ring-2 ring-slate-200 transition-all" />
        </div>
        <button className="p-2 bg-slate-50 rounded-xl text-slate-500 hover:bg-slate-100"><Filter size={18}/></button>
      </div>

      {/* TABLA PAGINADA */}
      <TransactionTable 
        transactions={paginatedTransactions} 
        onEdit={handleEdit} 
        onDelete={handleDelete} 
      />

      {/* CONTROLES PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center pt-4 border-t border-slate-50 mt-auto">
          <span className="text-xs font-bold text-slate-400">
            Mostrando {paginatedTransactions.length} items
          </span>
          <div className="flex gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <button 
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-50 text-slate-600 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
      
      <TransactionForm 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSave} 
        initialData={editingItem} 
      />
    </div>
  );
};