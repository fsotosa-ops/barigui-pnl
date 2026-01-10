'use client';
import { useState, useMemo } from 'react';
import { 
  Plus, Search, PieChart, List, BarChart3, TrendingUp, TrendingDown, Globe, Briefcase, User, Trash2, AlertTriangle 
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
  selectedIds?: string[];
  setSelectedIds?: (ids: string[]) => void;
  onBulkDelete?: () => Promise<void>;
}

export const TransactionManager = ({ 
  transactions, 
  setTransactions, 
  onAdd, 
  onDelete, 
  selectedIds = [], 
  setSelectedIds = () => {}, 
  onBulkDelete = async () => {} 
}: TransactionManagerProps) => {
  const [activeScope, setActiveScope] = useState<'all' | 'business' | 'personal'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Transaction | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
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
    let totalIncomeUSD = 0;
    let totalExpenseUSD = 0;
    const categories: Record<string, any> = {};

    filteredTxs.forEach((t) => {
      // Sumamos estrictamente la columna USD de la base de datos
      const val = Number(t.amountUSD) || 0;
      if (t.type === 'income') totalIncomeUSD += val;
      else totalExpenseUSD += val;

      if (!categories[t.category]) {
        categories[t.category] = { name: t.category, total: 0, type: t.type };
      }
      categories[t.category].total += val;
    });

    return { totalIncomeUSD, totalExpenseUSD, netBalanceUSD: totalIncomeUSD - totalExpenseUSD };
  }, [filteredTxs]);

  const formatMoney = (valUSD: number) => {
    const rate = rates[localCurrency] || 1;
    const convertedValue = valUSD * rate;
    
    // Si es CLP, COP o MXN quitamos decimales para limpieza visual
    const noDecimals = ['CLP', 'COP', 'MXN', 'JPY'].includes(localCurrency);
    
    return convertedValue.toLocaleString('en-US', { 
      style: 'currency', 
      currency: localCurrency,
      minimumFractionDigits: noDecimals ? 0 : 2,
      maximumFractionDigits: noDecimals ? 0 : 2 
    });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header de Filtros y Selección */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 h-12">
        {selectedIds.length > 0 ? (
           <div className="flex items-center gap-4 bg-rose-50 px-4 py-2 rounded-2xl w-full md:w-auto animate-in slide-in-from-left-2">
             <span className="text-rose-600 font-bold text-xs flex items-center gap-2"><AlertTriangle size={14}/> {selectedIds.length} seleccionados</span>
             <button onClick={onBulkDelete} className="text-xs font-black text-white bg-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-600 flex items-center gap-1"><Trash2 size={12}/> Eliminar</button>
             <button onClick={() => setSelectedIds([])} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
           </div>
        ) : (
          <div className="flex bg-slate-200/50 p-1 rounded-2xl border border-slate-200 w-full md:w-auto">
             {[
               { id: 'all', label: 'Consolidado', icon: <Globe size={14}/> },
               { id: 'business', label: 'Negocio', icon: <Briefcase size={14}/> },
               { id: 'personal', label: 'Personal', icon: <User size={14}/> }
             ].map((s) => (
               <button
                 key={s.id}
                 onClick={() => { setActiveScope(s.id as any); setCurrentPage(1); }}
                 className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeScope === s.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
               >
                 {s.icon} {s.label}
               </button>
             ))}
          </div>
        )}

        <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-slate-200">
            <span className="text-[9px] font-bold text-slate-400 ml-2 uppercase tracking-wider">Moneda Vista:</span>
            <select value={localCurrency} onChange={(e) => setLocalCurrency(e.target.value)} className="text-xs font-black outline-none pr-2 py-1 cursor-pointer bg-transparent">
              {['USD', 'CLP', 'BRL', 'EUR', 'COP', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>
      </div>

      {/* Badges de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-500 rounded-2xl"><TrendingUp size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingresos</p>
            <p className="text-xl font-black text-slate-900">{formatMoney(financialAnalysis.totalIncomeUSD)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-500 rounded-2xl"><TrendingDown size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gastos</p>
            <p className="text-xl font-black text-slate-900">{formatMoney(financialAnalysis.totalExpenseUSD)}</p>
          </div>
        </div>
        <div className={`p-6 rounded-[2rem] border shadow-sm flex items-center gap-4 ${financialAnalysis.netBalanceUSD >= 0 ? 'bg-emerald-900 border-emerald-800' : 'bg-rose-900 border-rose-800'}`}>
          <div className="p-3 bg-white/10 text-white rounded-2xl"><BarChart3 size={24}/></div>
          <div>
            <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">Balance Neto</p>
            <p className="text-xl font-black text-white">{formatMoney(financialAnalysis.netBalanceUSD)}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8 min-h-[600px] flex flex-col">
        {/* Controles de Tabla */}
        <div className="flex justify-between items-center mb-8">
            <div className="flex bg-slate-100 p-1 rounded-2xl">
                <button onClick={() => setViewMode('list')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><List size={16}/> Listado</button>
                <button onClick={() => setViewMode('analysis')} className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'analysis' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}><PieChart size={16}/> Insights</button>
            </div>
            <button onClick={() => { setEditingItem(null); setIsModalOpen(true); }} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs flex items-center gap-2 hover:bg-black shadow-lg shadow-slate-200 transition-all"><Plus size={16} /> Nueva</button>
        </div>

        {viewMode === 'list' ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-slate-50 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none border border-transparent focus:border-slate-200 focus:bg-white transition-all" />
                </div>
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="bg-slate-50 rounded-2xl py-3 px-4 text-xs font-bold outline-none border border-transparent focus:border-slate-200 focus:bg-white transition-all appearance-none cursor-pointer">
                    <option value="all">Todas las Categorías</option>
                    {Object.values(CATEGORIES).flat().map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
            </div>

            <div className="flex-1 overflow-x-auto no-scrollbar">
                <TransactionTable 
                    transactions={filteredTxs.slice((currentPage-1)*itemsPerPage, currentPage*itemsPerPage)} 
                    onEdit={(t) => { setEditingItem(t); setIsModalOpen(true); }} 
                    onDelete={onDelete!}
                    selectedIds={selectedIds}
                    onSelectChange={setSelectedIds!} 
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