import { TrendingUp, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MonthlyProjection {
  month: string;
  plannedSaving: number;
  actualSaving: number;
  status: 'chile' | 'landing' | 'mba';
}

interface TimelineProps {
  data: MonthlyProjection[];
}

export const TimelineDashboard = ({ data }: TimelineProps) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.plannedSaving, d.actualSaving)));

  return (
    <section className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Timeline de Ahorro</h3>
          <p className="text-lg font-bold text-slate-800">Plan vs. Real</p>
        </div>
        <Calendar className="text-slate-300" size={20} />
      </div>

      <div className="flex items-end justify-between h-48 gap-2">
        {data.map((item, i) => {
          const planHeight = (item.plannedSaving / maxVal) * 100;
          const actualHeight = (item.actualSaving / maxVal) * 100;
          const isOverPlan = item.actualSaving >= item.plannedSaving;

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
              {/* Tooltip on Hover */}
              <div className="absolute -top-12 bg-slate-800 text-white text-[10px] p-2 rounded lg opacity-0 group-hover:opacity-100 transition-opacity z-10 whitespace-nowrap">
                Plan: ${item.plannedSaving} | Real: ${item.actualSaving}
              </div>

              <div className="w-full flex items-end justify-center gap-1 h-full">
                {/* Barra Plan (Gris) */}
                <div 
                  className="w-2 bg-slate-100 rounded-t-sm" 
                  style={{ height: `${planHeight}%` }}
                />
                {/* Barra Real (Color dinámico) */}
                <div 
                  className={`w-3 rounded-t-sm transition-all duration-500 ${isOverPlan ? 'bg-emerald-400' : 'bg-rose-400'}`} 
                  style={{ height: `${actualHeight}%` }}
                />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase">{item.month}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
            <ArrowUpRight size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Promedio Real</p>
            <p className="text-sm font-black text-slate-800">$1,040</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
            <TrendingUp size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Proyección 12m</p>
            <p className="text-sm font-black text-slate-800">$12,480</p>
          </div>
        </div>
      </div>
    </section>
  );
};