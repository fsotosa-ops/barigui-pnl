'use client';
import { useState, useMemo } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, PieChart, List, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { TransactionTable } from './TransactionTable';
import { TransactionForm } from './TransactionForm';

interface TransactionManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onAdd?: (tx: any) => Promise<any>; 
}

export const TransactionManager = ({ transactions, setTransactions, onAdd }: TransactionManagerProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 25;

  // --- LÓGICA DE BALANCE Y CATEGORÍAS ---
  const financialAnalysis = useMemo(() => {
    const categories: Record<string, { name: string, type: string, total: number, count: number, color: string }> = {};
    let totalIncome = 0;
    let totalExpense = 0;

    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#f43f5e'];

    transactions.forEach((t, idx) => {
      if (t.type === 'income') totalIncome += t.amountUSD;
      else totalExpense += t.amountUSD;

      if (!categories[t.category]) {
        categories[t.category] = { 
          name: t.category, 
          type: t.type, 
          total: 0, 
          count: 0,
          color: colors[Object.keys(categories).length % colors.length]
        };
      }
      categories[t.category].total += t.amountUSD;
      categories[t.category].count += 1;
    });

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      categoryStats: Object.values(categories).sort((a, b) => b.total - a.total)
    };
  }, [transactions]);

  const filteredTxs = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm]);

  const paginatedTransactions = useMemo(() => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    return filteredTxs.slice(indexOfFirstItem, indexOfLastItem);
  }, [filteredTxs, currentPage]);

  const totalPages = Math.ceil(filteredTxs.length / itemsPerPage);

  const handleSave = async (data: Partial<Transaction>) => {
    if (editingItem) {
      setTransactions(prev => prev.map(t => t.id === editingItem.id ? { ...t, ...data } as Transaction : t));
    } else if (onAdd) {
      await onAdd(data);
    }
    setEditingItem(null);
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
      
      {/* 1. BALANCE CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos</p>
            <p className="text-xl font-black text-slate-900">${financialAnalysis.totalIncome.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><TrendingDown size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gastos</p>
            <p className="text-xl font-black text-slate-900">${financialAnalysis.totalExpense.toLocaleString()}</p>
          </div>
        </div>
        <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 ${financialAnalysis.netBalance >= 0 ? 'bg-emerald-900 border-emerald-800' : 'bg-rose-900 border-rose-800'}`}>
          <div className="p-3 bg-white/10 text-white rounded-2xl"><BarChart3 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Balance Neto</p>
            <p className="text-xl font-black text-white">${financialAnalysis.netBalance.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-5 md:p-8 flex flex-col min-h-[600px]">
        
        {/* SELECTOR DE VISTA */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            <button 
              onClick={() => setViewMode('list')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              <List size={16}/> Listado
            </button>
            <button 
              onClick={() => setViewMode('analysis')}
              className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}
            >
              <PieChart size={16}/> Visual Insights
            </button>
          </div>
          <button 
            onClick={() => { setEditingItem(null); setIsModalOpen(true); }} 
            className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
          >
            <Plus size={16} /> Nueva Transacción
          </button>
        </div>

        {viewMode === 'list' ? (
          <>
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o categoría..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none border border-transparent focus:border-slate-200 focus:bg-white transition-all" 
              />
            </div>

            <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 no-scrollbar">
              <TransactionTable 
                transactions={paginatedTransactions} 
                onEdit={(t) => { setEditingItem(t); setIsModalOpen(true); }} 
                onDelete={(id) => confirm('¿Eliminar?') && setTransactions(prev => prev.filter(x => x.id !== id))} 
              />
            </div>

            {/* PAGINACIÓN */}
            <div className="flex justify-between items-center pt-8 border-t border-slate-50 mt-auto"> 
              <span className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredTxs.length} Registros</span>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-slate-50 text-slate-400 disabled:opacity-20"><ChevronLeft/></button>
                <span className="text-xs font-black text-slate-800">Pág. {currentPage} / {totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-slate-50 text-slate-400 disabled:opacity-20"><ChevronRight/></button>
              </div>
            </div>
          </>
        ) : (
          /* NUEVA SECCIÓN DE GRÁFICOS */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* COMPARATIVO DE BARRAS (Ingreso vs Gasto) */}
            <div className="space-y-6">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Comparativo Global</h3>
               <div className="bg-slate-50 p-8 rounded-[2rem] flex flex-col justify-end h-64 gap-6">
                  <div className="flex items-end gap-8 h-full justify-center">
                     <div className="flex flex-col items-center gap-3 w-16">
                        <div className="w-full bg-emerald-500 rounded-t-xl transition-all duration-1000" style={{ height: `${(financialAnalysis.totalIncome / Math.max(financialAnalysis.totalIncome, financialAnalysis.totalExpense)) * 100}%` }}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Entrada</span>
                     </div>
                     <div className="flex flex-col items-center gap-3 w-16">
                        <div className="w-full bg-rose-500 rounded-t-xl transition-all duration-1000" style={{ height: `${(financialAnalysis.totalExpense / Math.max(financialAnalysis.totalIncome, financialAnalysis.totalExpense)) * 100}%` }}></div>
                        <span className="text-[10px] font-black text-slate-400 uppercase">Salida</span>
                     </div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Ahorro Neto</p>
                    <p className={`text-lg font-black ${financialAnalysis.netBalance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ${financialAnalysis.netBalance.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-center">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-1">% de Gasto</p>
                    <p className="text-lg font-black text-slate-800">
                        {Math.round((financialAnalysis.totalExpense / (financialAnalysis.totalIncome || 1)) * 100)}%
                    </p>
                  </div>
               </div>
            </div>

            {/* DISTRIBUCIÓN POR CATEGORÍA (Donut Chart Visual) */}
            <div className="space-y-6">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Distribución de Gastos</h3>
               <div className="space-y-3">
                  {financialAnalysis.categoryStats.filter(c => c.type === 'expense').map((cat) => (
                    <div key={cat.name} className="group">
                        <div className="flex justify-between items-center mb-1 px-1">
                            <span className="text-[11px] font-black text-slate-700">{cat.name}</span>
                            <span className="text-[11px] font-bold text-slate-400">${cat.total.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000" 
                              style={{ 
                                width: `${(cat.total / financialAnalysis.totalExpense) * 100}%`,
                                backgroundColor: cat.color 
                              }}
                            ></div>
                        </div>
                    </div>
                  ))}
                  {financialAnalysis.categoryStats.filter(c => c.type === 'expense').length === 0 && (
                    <div className="h-48 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 text-xs font-bold">
                        No hay gastos registrados
                    </div>
                  )}
               </div>
            </div>

          </div>
        )}
      </div>

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSave} initialData={editingItem} />
    </div>
  );
};