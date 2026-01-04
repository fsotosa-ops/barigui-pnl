import { Clock, Zap, Percent } from 'lucide-react';

interface MetricGridProps {
  data: {
    variance: number;
    runway: number;
    savingsRate: number; // Nueva métrica
  };
}

export const MetricGrid = ({ data }: MetricGridProps) => {
  const isOverPlan = data.variance >= 0;
  const isSavingsHealthy = data.savingsRate >= 20; // Meta saludable > 20%

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. PLAN NETO */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Zap size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Plan Neto</span>
        </div>
        <div>
          <p className={`text-3xl font-black ${isOverPlan ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isOverPlan ? '+' : ''}${data.variance}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Diferencia vs Presupuesto</p>
        </div>
      </div>

      {/* 2. TASA DE AHORRO (NUEVO) */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Percent size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Tasa de Ahorro</span>
        </div>
        <div>
          <p className={`text-3xl font-black ${isSavingsHealthy ? 'text-blue-600' : 'text-orange-500'}`}>
            {data.savingsRate}%
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Margen Operativo Mensual</p>
        </div>
      </div>

      {/* 3. RUNWAY */}
      <div className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Clock size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Runway</span>
        </div>
        <div>
          <p className="text-3xl font-black text-slate-900">
            {data.runway} <span className="text-lg font-bold text-slate-300">meses</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Vida útil de caja</p>
        </div>
      </div>
    </div>
  );
};