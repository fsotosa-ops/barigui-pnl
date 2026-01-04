import { ArrowUpCircle, ArrowDownCircle, PieChart } from 'lucide-react';

interface CategorySummary {
  name: string;
  amount: number;
  type: 'income' | 'expense';
}

interface BalanceSheetProps {
  summaries: CategorySummary[];
}

export const BalanceSheet = ({ summaries }: BalanceSheetProps) => {
  const totalIncome = summaries
    .filter(s => s.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpenses = summaries
    .filter(s => s.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const netBalance = totalIncome - totalExpenses;

  return (
    <section className="space-y-6">
      {/* Resumen Superior */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center flex-1">Balance Neto Mensual</p>
        </div>
        <p className="text-5xl font-black text-center mb-8 tracking-tighter">
          ${netBalance.toLocaleString()}
        </p>
        
        <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
          <div className="flex items-center gap-3">
            <ArrowUpCircle className="text-emerald-400" size={20} />
            <div>
              <p className="text-[9px] font-bold text-slate-500 uppercase">Ingresos</p>
              <p className="text-sm font-bold text-emerald-400">${totalIncome}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-500 uppercase">Gastos</p>
              <p className="text-sm font-bold text-rose-400">${totalExpenses}</p>
            </div>
            <ArrowDownCircle className="text-rose-400" size={20} />
          </div>
        </div>
      </div>

      {/* Desglose por Categorías */}
      <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <PieChart size={16} className="text-slate-400" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Distribución</h3>
        </div>
        <div className="space-y-4">
          {summaries.map((cat, i) => (
            <div key={i} className="flex justify-between items-center">
              <span className="text-sm font-medium text-slate-600">{cat.name}</span>
              <div className="flex items-center gap-3">
                <div className="w-24 bg-slate-50 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${cat.type === 'income' ? 'bg-emerald-400' : 'bg-slate-200'}`}
                    style={{ width: `${(cat.amount / (cat.type === 'income' ? totalIncome : totalExpenses)) * 100}%` }}
                  />
                </div>
                <span className={`text-sm font-bold ${cat.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                  ${cat.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};