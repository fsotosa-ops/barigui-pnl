import { Receipt, DollarSign } from 'lucide-react';

interface Transaction {
  id: string;
  description: string;
  category: string;
  amountUSD: number;
  originalCurrency: string;
  date: string;
  isIncome: boolean;
}

export const TransactionLog = ({ transactions }: { transactions: Transaction[] }) => {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-2">Movimientos Recientes</h3>
      {transactions.map((t) => (
        <div key={t.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex justify-between items-center group active:bg-slate-50 transition-colors">
          <div className="flex items-center gap-4">
            <div className={`p-2 rounded-xl ${t.isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
              {t.isIncome ? <DollarSign size={18}/> : <Receipt size={18}/>}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{t.description}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{t.category}</span>
                <span className="text-[10px] text-slate-300">•</span>
                <span className="text-[10px] font-medium text-slate-400">{t.originalCurrency}</span>
              </div>
            </div>
          </div>
          <p className={`font-black ${t.isIncome ? 'text-emerald-500' : 'text-slate-900'}`}>
            {t.isIncome ? '+' : '-'}${Math.abs(t.amountUSD)}
          </p>
        </div>
      ))}
    </div>
  );
};