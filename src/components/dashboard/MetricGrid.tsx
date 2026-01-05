'use client';
import { useState, useEffect } from 'react';
import { Clock, Zap, Percent } from 'lucide-react';

interface MetricGridProps {
  data: {
    variance: number;
    runway: number;
    savingsRate: number;
  };
}

export const MetricGrid = ({ data }: MetricGridProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isOverPlan = data.variance >= 0;
  const isSavingsHealthy = data.savingsRate >= 20;

  // Formateo seguro para hidratación
  const formattedVariance = mounted ? data.variance.toLocaleString() : data.variance.toString();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 1. MARGEN DE LIBERTAD */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Zap size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Margen de Libertad</span>
        </div>
        <div>
          <p className={`text-3xl font-black ${isOverPlan ? 'text-emerald-500' : 'text-rose-500'}`}>
            {isOverPlan ? '+' : ''}${formattedVariance}
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Excedente sobre el costo de vida</p>
        </div>
      </div>

      {/* 2. EFICIENCIA OPERATIVA */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Percent size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Eficiencia Mensual</span>
        </div>
        <div>
          <p className={`text-3xl font-black ${isSavingsHealthy ? 'text-violet-600' : 'text-orange-500'}`}>
            {data.savingsRate}%
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Capacidad de reinversión</p>
        </div>
      </div>

      {/* 3. SOBREVIVENCIA */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-2 text-slate-400">
          <Clock size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Sobrevivencia (Runway)</span>
        </div>
        <div>
          <p className="text-3xl font-black text-slate-900">
            {data.runway} <span className="text-lg font-bold text-slate-300">meses</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium">Autonomía con caja actual</p>
        </div>
      </div>
    </div>
  );
};