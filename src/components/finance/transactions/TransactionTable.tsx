'use client';
import { Edit2, Trash2, FileText } from 'lucide-react';
import { Transaction } from '@/types/finance';

interface TransactionTableProps {
  transactions: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionTable = ({ transactions, onEdit, onDelete }: TransactionTableProps) => {
  return (
    <div className="overflow-x-auto flex-1">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
            <th className="pb-4 pl-2">Fecha</th>
            <th className="pb-4">Descripción</th>
            <th className="pb-4">Monto Orig.</th>
            <th className="pb-4 text-right">USD Norm.</th>
            <th className="pb-4 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody className="text-sm">
          {transactions.map((t) => (
            <tr key={t.id} className="group hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0">
              <td className="py-4 pl-2 font-medium text-slate-500 tabular-nums">{t.date}</td>
              <td className="py-4">
                <div className="flex items-center gap-2">
                  {t.description.includes('Autoimportado') && <FileText size={12} className="text-blue-400" />}
                  <span className="font-bold text-slate-700">{t.description}</span>
                </div>
                <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${t.type === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {t.category}
                </span>
              </td>
              <td className="py-4 font-medium text-slate-500 tabular-nums">
                  {t.originalAmount.toLocaleString()} <span className="text-[10px] font-bold">{t.originalCurrency}</span>
              </td>
              <td className={`py-4 text-right font-black tabular-nums ${t.type === 'income' ? 'text-emerald-500' : 'text-slate-800'}`}>
                {t.type === 'income' ? '+' : '-'}${t.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </td>
              <td className="py-4 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit(t)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit2 size={14} /></button>
                <button onClick={() => onDelete(t.id)} className="p-2 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100"><Trash2 size={14} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};