'use client';
import { useState, useEffect } from 'react';
import { Clock, Zap, Percent, CalendarDays, History } from 'lucide-react';

interface MetricGridProps {
  data: {
    variance: number;
    runway: number;
    savingsRate: number;
  };
  mode: 'annual' | 'rolling';
  setMode: (mode: 'annual' | 'rolling') => void;
}

export const MetricGrid = ({ data, mode, setMode }: MetricGridProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPositive = data.variance >= 0;
  const isHealthy = data.savingsRate >= 20;

  // Formateo seguro para hidratación
  const formattedVariance = mounted ? data.variance.toLocaleString() : data.variance.toString();

  return (
    <div className="space-y-4">
      {/* Selector de Perspectiva */}
      <div className="flex justify-end">
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
          <button 
            onClick={() => setMode('rolling')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'rolling' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <History size={14}/> 12 Meses Móviles
          </button>
          <button 
            onClick={() => setMode('annual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'annual' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <CalendarDays size={14}/> Año Calendario
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. MARGEN DE LIBERTAD */}
        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2 text-slate-400">
                <Zap size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Margen de Libertad</span>
             </div>
             <span className="text-[9px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full uppercase">Promedio</span>
          </div>
          <div>
            <p className={`text-3xl font-black ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? '+' : ''}${formattedVariance}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Excedente mensual real</p>
          </div>
        </div>

        {/* 2. EFICIENCIA OPERATIVA */}
        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-violet-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2 text-slate-400">
                <Percent size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Eficiencia Real</span>
             </div>
             <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${isHealthy ? 'bg-emerald-50 text-emerald-600' : 'bg-orange-50 text-orange-600'}`}>
                {isHealthy ? 'Óptima' : 'A mejorar'}
            </span>
          </div>
          <div>
            <p className={`text-3xl font-black ${isHealthy ? 'text-violet-600' : 'text-orange-500'}`}>
              {data.savingsRate}%
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Capacidad de reinversión</p>
          </div>
        </div>

        {/* 3. SOBREVIVENCIA */}
        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between mb-2 text-slate-400">
             <div className="flex items-center gap-2">
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sobrevivencia</span>
             </div>
             <span className="text-[9px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full uppercase">Vida</span>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900">
              {data.runway} <span className="text-lg font-bold text-slate-300">meses</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Autonomía según gasto actual</p>
          </div>
        </div>
      </div>
    </div>
  );
};