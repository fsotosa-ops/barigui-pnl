'use client';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '@/types/finance';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
}

export const TransactionTable = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  selectedIds = [], 
  onSelectChange 
}: TransactionTableProps) => {
  
  const areAllSelected = transactions.length > 0 && transactions.every(t => selectedIds.includes(t.id));

  const toggleAll = () => {
    if (!onSelectChange) return;
    if (areAllSelected) {
      const newSelected = selectedIds.filter(id => !transactions.find(t => t.id === id));
      onSelectChange(newSelected);
    } else {
      const idsToAdd = transactions.map(t => t.id).filter(id => !selectedIds.includes(id));
      onSelectChange([...selectedIds, ...idsToAdd]);
    }
  };

  const toggleOne = (id: string) => {
    if (!onSelectChange) return;
    if (selectedIds.includes(id)) {
      onSelectChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectChange([...selectedIds, id]);
    }
  };

  return (
    <div className="w-full">
      <table className="w-full text-left border-collapse min-w-[600px] md:min-w-0">
        <thead>
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            {onSelectChange && (
              <th className="pb-4 pl-4 w-10 align-middle">
                <div className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                    checked={areAllSelected}
                    onChange={toggleAll}
                  />
                </div>
              </th>
            )}
            <th className="pb-4 pl-2">Fecha</th>
            <th className="pb-4">Detalle / Categoría</th>
            <th className="pb-4 text-right">Monto Original</th>
            <th className="pb-4 text-right pr-4">Monto USD</th>
            <th className="pb-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {transactions.map((t) => (
            <tr key={t.id} className={`group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${selectedIds.includes(t.id) ? 'bg-emerald-50/30' : ''}`}>
              
              {onSelectChange && (
                <td className="py-4 pl-4 align-middle">
                   <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer accent-emerald-500"
                      checked={selectedIds.includes(t.id)}
                      onChange={() => toggleOne(t.id)}
                    />
                  </div>
                </td>
              )}

              <td className="py-4 pl-2 font-bold text-slate-400 tabular-nums">
                {new Date(t.date).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })}
              </td>
              <td className="py-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    {t.type === 'income' ? 
                      <ArrowUpRight size={10} className="text-emerald-500" /> : 
                      <ArrowDownLeft size={10} className="text-rose-500" />
                    }
                    <span className="font-bold text-slate-700 truncate max-w-[200px]">{t.description}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-300 tracking-tighter">{t.category}</span>
                </div>
              </td>
              <td className="py-4 text-right font-medium text-slate-400 tabular-nums">
                <div className="flex items-center justify-end gap-1">
                   {t.originalAmount.toLocaleString('es-CL')}
                   <span className="text-[9px] font-black text-slate-300 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                     {t.originalCurrency}
                   </span>
                </div>
              </td>
              <td className={`py-4 text-right pr-4 font-black tabular-nums text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-800'}`}>
                {t.type === 'income' ? '+' : '-'}${t.amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-4">
                <div className="flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-blue-500"><Edit2 size={14} /></button>
                  <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-500"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};