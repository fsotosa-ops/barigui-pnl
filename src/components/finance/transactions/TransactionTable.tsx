'use client';
import { Edit2, Trash2, ArrowUpRight, ArrowDownLeft, FileCode, Calendar } from 'lucide-react';
import { Transaction, ImportBatch } from '@/types/finance';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
  selectedIds?: string[];
  onSelectChange?: (ids: string[]) => void;
  importBatches?: ImportBatch[]; 
}

export const TransactionTable = ({ 
  transactions, 
  onEdit, 
  onDelete, 
  selectedIds = [], 
  onSelectChange,
  importBatches = []
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

  const getBatchInfo = (batchId?: string) => {
    if (!batchId) return { name: 'Manual', date: null };
    const batch = importBatches.find(b => b.id === batchId);
    return {
      name: batch?.filename || 'Archivo desconocido',
      date: batch?.created_at ? new Date(batch.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : null
    };
  };

  return (
    <div className="w-full">
      <table className="w-full text-left border-collapse min-w-[800px]">
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
            <th className="pb-4">Origen / Carga</th>
            <th className="pb-4 text-right">Monto Original</th>
            <th className="pb-4 text-right pr-4">Monto USD</th>
            <th className="pb-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {transactions.map((t) => {
            const batchInfo = getBatchInfo(t.importBatchId);
            const isManual = !t.importBatchId;

            return (
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

                <td className="py-4">
                   <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5 text-slate-500">
                         {isManual ? (
                            <span className="text-[9px] font-bold bg-slate-100 text-slate-400 px-1.5 py-0.5 rounded">MANUAL</span>
                         ) : (
                            <>
                              <FileCode size={12} className="text-indigo-400 shrink-0" />
                              <span className="font-bold truncate max-w-[120px] text-[10px]" title={batchInfo.name}>{batchInfo.name}</span>
                            </>
                         )}
                      </div>
                      {!isManual && batchInfo.date && (
                         <div className="flex items-center gap-1.5 text-slate-400 pl-0.5">
                            <Calendar size={10} />
                            <span className="text-[9px] font-medium">{batchInfo.date}</span>
                         </div>
                      )}
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
};