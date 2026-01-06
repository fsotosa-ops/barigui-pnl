'use client';
import { useState, useMemo } from 'react';
import { Plus, Search, ChevronLeft, ChevronRight, PieChart, List, BarChart3, TrendingUp, TrendingDown, FilterX, Globe } from 'lucide-react';
import { Transaction } from '@/types/finance';
import { TransactionTable } from './TransactionTable';
import { TransactionForm } from './TransactionForm';
import { useExchangeRates } from '@/hooks/useExchangeRates';

interface TransactionManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onAdd?: (tx: any) => Promise<any>; 
  onDelete?: (id: string) => Promise<void>;
}

export const TransactionManager = ({ transactions, setTransactions, onAdd, onDelete }: TransactionManagerProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // --- HOOK DE TASAS Y ESTADO LOCAL DE MONEDA ---
  const { rates } = useExchangeRates();
  const [localCurrency, setLocalCurrency] = useState('USD');

  const itemsPerPage = 25;

  const uniqueCategories = useMemo(() => {
    const cats = new Set(transactions.map(t => t.category));
    return Array.from(cats).sort();
  }, [transactions]);

  // Helper para formatear montos según la moneda seleccionada
  const formatMoney = (amountUSD: number) => {
    const rate = rates[localCurrency] || 1;
    const value = amountUSD * rate;
    return value.toLocaleString('en-US', { 
      style: 'currency', 
      currency: localCurrency,
      maximumFractionDigits: 0 
    });
  };

  const financialAnalysis = useMemo(() => {
    const categories: Record<string, { name: string, type: string, total: number, count: number, color: string }> = {};
    let totalIncome = 0;
    let totalExpense = 0;
    const colors = ['#10b981', '#3b82f6', '#f59e0b', '#6366f1', '#ec4899', '#8b5cf6', '#f43f5e'];

    transactions.forEach((t) => {
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

    const maxVal = Math.max(totalIncome, totalExpense);
    let chartMax = 1000;
    if (maxVal > 0) {
        const magnitude = Math.pow(10, Math.floor(Math.log10(maxVal)));
        chartMax = Math.ceil(maxVal / (magnitude / 2)) * (magnitude / 2);
        if (chartMax < maxVal * 1.05) {
            chartMax += magnitude / 2;
        }
    }

    return {
      totalIncome,
      totalExpense,
      netBalance: totalIncome - totalExpense,
      chartMax,
      categoryStats: Object.values(categories).sort((a, b) => b.total - a.total)
    };
  }, [transactions]);

  const filteredTxs = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesSearch && matchesCategory && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, categoryFilter, typeFilter]);

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

  const resetFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setCurrentPage(1);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER DE LA SECCIÓN CON SELECTOR DE MONEDA */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
           <div className="pl-2 text-slate-400"><Globe size={14}/></div>
           <select 
             value={localCurrency} 
             onChange={(e) => setLocalCurrency(e.target.value)}
             className="bg-transparent text-xs font-black uppercase text-slate-700 outline-none pr-2 py-1 cursor-pointer"
           >
             <option value="USD">USD</option>
             <option value="CLP">CLP</option>
             <option value="BRL">BRL</option>
             <option value="EUR">EUR</option>
             <option value="MXN">MXN</option>
             <option value="COP">COP</option>
           </select>
        </div>
      </div>

      {/* 1. BALANCE CARDS CON MONEDA DINÁMICA */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos</p>
            <p className="text-xl font-black text-slate-900">{formatMoney(financialAnalysis.totalIncome)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><TrendingDown size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gastos</p>
            <p className="text-xl font-black text-slate-900">{formatMoney(financialAnalysis.totalExpense)}</p>
          </div>
        </div>
        <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 ${financialAnalysis.netBalance >= 0 ? 'bg-emerald-900 border-emerald-800' : 'bg-rose-900 border-rose-800'}`}>
          <div className="p-3 bg-white/10 text-white rounded-2xl"><BarChart3 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Balance Neto</p>
            <p className="text-xl font-black text-white">{formatMoney(financialAnalysis.netBalance)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-5 md:p-8 flex flex-col min-h-[600px]">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            <button onClick={() => setViewMode('list')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><List size={16}/> Listado</button>
            <button onClick={() => setViewMode('analysis')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><PieChart size={16}/> Visual Insights</button>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg shadow-slate-200"><Plus size={16} /> Nueva Transacción</button>
        </div>

        {viewMode === 'list' ? (
          <>
             {/* FILTROS */}
             <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="Buscar descripción..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="w-full bg-slate-50 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold text-slate-700 outline-none border border-transparent focus:border-slate-200 focus:bg-white transition-all" />
              </div>
              <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }} className="bg-slate-50 rounded-2xl py-3 px-4 text-xs font-bold text-slate-600 outline-none border border-transparent focus:border-slate-200 focus:bg-white transition-all appearance-none cursor-pointer">
                <option value="all">Todas las Categorías</option>
                {uniqueCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <div className="flex gap-2">
                <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }} className="flex-1 bg-slate-50 rounded-2xl py-3 px-4 text-xs font-bold text-slate-600 outline-none border border-transparent focus:border-slate-200 focus:bg-white transition-all appearance-none cursor-pointer">
                  <option value="all">Todos los Tipos</option>
                  <option value="income">📈 Ingresos</option>
                  <option value="expense">📉 Gastos</option>
                </select>
                {(searchTerm || categoryFilter !== 'all' || typeFilter !== 'all') && (
                  <button onClick={resetFilters} className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors shrink-0" title="Limpiar Filtros"><FilterX size={18} /></button>
                )}
              </div>
            </div>

            <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 no-scrollbar">
              <TransactionTable 
                transactions={paginatedTransactions} 
                onEdit={(t) => { setEditingItem(t); setIsModalOpen(true); }} 
                // AQUÍ CONECTAMOS EL BORRADO REAL
                onDelete={(id) => confirm('¿Eliminar registro permanentemente?') && onDelete && onDelete(id)} 
              />
            </div>
            
            <div className="flex justify-between items-center pt-8 border-t border-slate-50 mt-auto"> 
              <span className="hidden md:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">{filteredTxs.length} registros filtrados</span>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="p-2 rounded-lg bg-slate-50 text-slate-400 disabled:opacity-20 transition-all hover:bg-slate-100"><ChevronLeft size={20}/></button>
                <span className="text-xs font-black text-slate-800 tabular-nums">Pág. {currentPage} / {totalPages || 1}</span>
                <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="p-2 rounded-lg bg-slate-50 text-slate-400 disabled:opacity-20 transition-all hover:bg-slate-100"><ChevronRight size={20}/></button>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 animate-in slide-in-from-bottom-4 duration-500 min-h-[500px]">
            {/* COMPARATIVO DE BARRAS */}
            <div className="flex flex-col h-full space-y-6">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Comparativo Global</h3>
               <div className="bg-slate-50 p-6 md:p-10 rounded-[2rem] flex-1 min-h-[350px] relative overflow-hidden flex flex-col justify-end">
                  <div className="flex h-full pb-8 items-end">
                      <div className="flex flex-col justify-between h-full pr-4 border-r border-slate-200 text-[9px] font-black text-slate-300 uppercase shrink-0 tabular-nums text-right pb-8 pt-2">
                          <span>${financialAnalysis.chartMax.toLocaleString()}</span>
                          <span>${Math.round(financialAnalysis.chartMax / 2).toLocaleString()}</span>
                          <span>$0</span>
                      </div>
                      <div className="flex-1 flex items-end justify-around h-full px-4 relative pb-8">
                          <div className="absolute top-2 left-0 w-full h-px border-t border-dashed border-slate-200 pointer-events-none opacity-30"></div>
                          <div className="absolute top-1/2 left-0 w-full h-px border-t border-dashed border-slate-200 pointer-events-none opacity-50"></div>
                          <div className="absolute bottom-8 left-0 w-full h-px border-t border-slate-200"></div>
                          
                          <div className="relative h-full w-24 flex items-end justify-center group z-10">
                              <div className="w-full bg-emerald-500 rounded-t-2xl shadow-lg shadow-emerald-500/20 transition-all duration-1000 ease-out relative"
                                  style={{ height: `${(financialAnalysis.totalIncome / financialAnalysis.chartMax) * 100}%`, minHeight: '6px' }}>
                                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm border border-emerald-100 pointer-events-none">
                                      {formatMoney(financialAnalysis.totalIncome)}
                                  </span>
                              </div>
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Entrada</span>
                          </div>

                          <div className="relative h-full w-24 flex items-end justify-center group z-10">
                              <div className="w-full bg-rose-500 rounded-t-2xl shadow-lg shadow-rose-500/20 transition-all duration-1000 ease-out relative"
                                  style={{ height: `${(financialAnalysis.totalExpense / financialAnalysis.chartMax) * 100}%`, minHeight: '6px' }}>
                                  <span className="absolute -top-9 left-1/2 -translate-x-1/2 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-sm border border-rose-100 pointer-events-none">
                                      {formatMoney(financialAnalysis.totalExpense)}
                                  </span>
                              </div>
                              <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">Salida</span>
                          </div>
                      </div>
                  </div>
               </div>
            </div>

            {/* DISTRIBUCIÓN POR CATEGORÍA */}
            <div className="flex flex-col h-full">
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Distribución de Gastos</h3>
               <div className="flex-1 flex flex-col justify-center">
                  <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 no-scrollbar w-full">
                      {financialAnalysis.categoryStats.filter(c => c.type === 'expense').map((cat) => (
                        <div key={cat.name} className="group cursor-default">
                            <div className="flex justify-between items-center mb-1.5 px-1">
                                <span className="text-xs font-black text-slate-700">{cat.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-bold text-slate-400">{formatMoney(cat.total)}</span>
                                    <span className="text-[10px] font-black text-slate-300">({Math.round((cat.total / (financialAnalysis.totalExpense || 1)) * 100)}%)</span>
                                </div>
                            </div>
                            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-1000 shadow-inner" 
                                  style={{ width: `${(cat.total / (financialAnalysis.totalExpense || 1)) * 100}%`, backgroundColor: cat.color }}></div>
                            </div>
                        </div>
                      ))}
                      {financialAnalysis.categoryStats.filter(c => c.type === 'expense').length === 0 && (
                        <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-100 rounded-[2rem] text-slate-300 text-xs font-bold uppercase tracking-widest">
                            Sin datos de gastos
                        </div>
                      )}
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleSave} initialData={editingItem} />
    </div>
  );
};