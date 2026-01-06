'use client';
import { Edit2, Trash2, FileText, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Transaction } from '@/types/finance';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionTable = ({ transactions, onEdit, onDelete }: TransactionTableProps) => {
  return (
    <div className="w-full">
      <table className="w-full text-left border-collapse min-w-[500px] md:min-w-0">
        <thead>
          <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <th className="pb-4 pl-2">Fecha</th>
            <th className="pb-4">Detalle</th>
            <th className="pb-4 text-right pr-4">Monto USD</th>
            <th className="pb-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-xs">
          {transactions.map((t) => (
            <tr key={t.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
              <td className="py-4 pl-2 font-bold text-slate-400 tabular-nums">
                {t.date.split('-').slice(1).reverse().join('/')}
              </td>
              <td className="py-4">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1.5">
                    {t.type === 'income' ? 
                      <ArrowUpRight size={10} className="text-emerald-500" /> : 
                      <ArrowDownLeft size={10} className="text-rose-500" />
                    }
                    <span className="font-bold text-slate-700 truncate max-w-[120px] md:max-w-[200px]">{t.description}</span>
                  </div>
                  <span className="text-[9px] font-black uppercase text-slate-300 tracking-tighter">{t.category}</span>
                </div>
              </td>
              <td className={`py-4 text-right pr-4 font-black tabular-nums text-sm ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-800'}`}>
                {t.type === 'income' ? '+' : '-'}${t.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 0 })}
              </td>
              <td className="py-4">
                <div className="flex justify-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  <button onClick={() => onEdit(t)} className="p-2 text-slate-400 hover:text-blue-500 transition-colors"><Edit2 size={14} /></button>
                  <button onClick={() => onDelete(t.id)} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {transactions.length === 0 && (
        <div className="py-20 text-center text-slate-300 font-bold uppercase text-[10px] tracking-widest">
            Sin movimientos registrados en este periodo
        </div>
      )}
    </div>
  );
};