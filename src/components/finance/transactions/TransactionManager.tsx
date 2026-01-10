'use client';
import { useState, useMemo } from 'react';
import { 
  Plus, Search, ChevronLeft, ChevronRight, PieChart, 
  List, BarChart3, TrendingUp, TrendingDown, FilterX, Globe, Briefcase, User 
} from 'lucide-react';
import { Transaction } from '@/types/finance';
import { TransactionTable } from './TransactionTable';
import { TransactionForm } from './TransactionForm';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { CATEGORIES } from '@/lib/constants/finance';

interface TransactionManagerProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  onAdd?: (tx: any) => Promise<any>; 
  onDelete?: (id: string) => Promise<void>;
}

export const TransactionManager = ({ transactions, setTransactions, onAdd, onDelete }: TransactionManagerProps) => {
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');
  const [activeScope, setActiveScope] = useState<'all' | 'business' | 'personal'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  
  const { rates } = useExchangeRates();
  const [localCurrency, setLocalCurrency] = useState('USD');
  const itemsPerPage = 25;

  const filteredTxs = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesScope = activeScope === 'all' || t.scope === activeScope;
      return matchesSearch && matchesCategory && matchesScope;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, searchTerm, categoryFilter, activeScope]);

  const financialAnalysis = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    const categories: Record<string, any> = {};

    filteredTxs.forEach((t) => {
      // SIEMPRE sumar el valor en USD para mantener la base de cálculo limpia
      const val = Number(t.amountUSD) || 0;
      if (t.type === 'income') totalIncome += val;
      else totalExpense += val;

      if (!categories[t.category]) {
        categories[t.category] = { name: t.category, total: 0, type: t.type };
      }
      categories[t.category].total += val;
    });

    return { 
      totalIncome, 
      totalExpense, 
      netBalance: totalIncome - totalExpense, 
      categoryStats: Object.values(categories) 
    };
  }, [filteredTxs]);

  const formatMoney = (valUSD: number) => {
    const rate = rates[localCurrency] || 1;
    const displayValue = valUSD * rate;
    
    // Configuración de decimales: USD/EUR usan 2, CLP/COP usan 0
    const hasDecimals = localCurrency === 'USD' || localCurrency === 'EUR';
    
    return displayValue.toLocaleString('en-US', { 
      style: 'currency', 
      currency: localCurrency,
      minimumFractionDigits: hasDecimals ? 2 : 0,
      maximumFractionDigits: hasDecimals ? 2 : 0 
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
           {[
             { id: 'all', label: 'Consolidado', icon: <Globe size={14}/> },
             { id: 'business', label: 'Negocio', icon: <Briefcase size={14}/> },
             { id: 'personal', label: 'Personal', icon: <User size={14}/> }
           ].map((s) => (
             <button
               key={s.id}
               onClick={() => { setActiveScope(s.id as any); setCurrentPage(1); }}
               className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                 activeScope === s.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'
               }`}
             >
               {s.icon} {s.label}
             </button>
           ))}
        </div>
        <select value={localCurrency} onChange={(e) => setLocalCurrency(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none cursor-pointer w-full md:w-auto">
          {['USD', 'CLP', 'BRL', 'EUR', 'COP', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

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

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 min-h-[600px] flex flex-col">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
            <button onClick={() => setViewMode('list')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-50'}`}><List size={16}/> Listado</button>
            <button onClick={() => setViewMode('analysis')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><PieChart size={16}/> Insights</button>
          </div>
          <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="w-full md:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg"><Plus size={16} /> Nueva Transacción</button>
        </div>

        {viewMode === 'list' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none border border-transparent focus:border-slate-200 focus:bg-white transition-all" />
              </div>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-slate-50 rounded-2xl py-3 px-4 text-xs font-bold outline-none cursor-pointer">
                <option value="all">Todas las Categorías</option>
                {Object.values(CATEGORIES).flat().map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            <div className="flex-1 overflow-x-auto no-scrollbar">
              <TransactionTable 
                transactions={filteredTxs.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage)} 
                onEdit={(t) => { setEditingItem(t); setIsModalOpen(true); }} 
                onDelete={onDelete!} 
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 italic font-medium">Cargando análisis de gastos para el ámbito {activeScope}...</div>
        )}
      </div>

      <TransactionForm isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={onAdd!} initialData={editingItem} />
    </div>
  );
};