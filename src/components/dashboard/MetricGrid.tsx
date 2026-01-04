import { Clock, Zap } from 'lucide-react';

// Definimos la forma de los datos
interface MetricGridProps {
  data: {
    variance: number;
    runway: number;
  };
}

export const MetricGrid = ({ data }: MetricGridProps) => {
  const isOverPlan = data.variance >= 0;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Zap size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Plan Neto</span>
        </div>
        <p className={`text-2xl font-black ${isOverPlan ? 'text-emerald-500' : 'text-rose-500'}`}>
          {isOverPlan ? '+' : ''}${data.variance}
        </p>
        <p className="text-[10px] text-slate-400 mt-1 italic">vs. $2,600 baseline</p>
      </div>

      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Clock size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest">Runway</span>
        </div>
        <p className="text-2xl font-black text-slate-800">{data.runway} <span className="text-sm font-medium">meses</span></p>
        <p className="text-[10px] text-slate-400 mt-1 italic">Seguridad financiera</p>
      </div>
    </div>
  );
};