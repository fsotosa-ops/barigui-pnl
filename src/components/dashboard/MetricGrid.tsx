'use client';
import { useState, useEffect } from 'react';
import { Clock, Zap, Percent, CalendarDays, History, Globe } from 'lucide-react';

interface MetricGridProps {
  data: {
    variance: number;
    runway: number;
    savingsRate: number;
    currency: string;
  };
  mode: 'annual' | 'rolling';
  setMode: (mode: 'annual' | 'rolling') => void;
  currency: string;
  setCurrency: (curr: string) => void;
}

export const MetricGrid = ({ data, mode, setMode, currency, setCurrency }: MetricGridProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isPositive = data.variance >= 0;
  const isHealthy = data.savingsRate >= 20;

  // Formateo seguro para hidratación
  const formattedVariance = mounted ? Math.round(data.variance).toLocaleString() : '0';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap justify-between items-center gap-4">
        
        {/* Selector de Moneda */}
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
           <div className="pl-3 text-slate-400"><Globe size={14}/></div>
           <select 
             value={currency} 
             onChange={(e) => setCurrency(e.target.value)}
             className="bg-transparent text-[10px] font-black uppercase text-slate-700 outline-none pr-2 py-2 cursor-pointer"
           >
             <option value="USD">USD (Dólar)</option>
             <option value="CLP">CLP (Chile)</option>
             <option value="BRL">BRL (Brasil)</option>
             <option value="EUR">EUR (Euro)</option>
             <option value="MXN">MXN (México)</option>
           </select>
        </div>

        {/* Selector de Perspectiva */}
        <div className="bg-white p-1 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
          <button 
            onClick={() => setMode('rolling')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'rolling' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <History size={14}/> 12m Móviles
          </button>
          <button 
            onClick={() => setMode('annual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'annual' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            <CalendarDays size={14}/> Anual
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. MARGEN REAL (En moneda seleccionada) */}
        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-emerald-200 transition-colors">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center gap-2 text-slate-400">
                <Zap size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Margen de Libertad</span>
             </div>
             <span className="text-[9px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md uppercase">{data.currency}</span>
          </div>
          <div>
            <p className={`text-3xl font-black tabular-nums ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {isPositive ? '+' : ''}${formattedVariance}
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium italic">Excedente mensual real</p>
          </div>
        </div>

        {/* 2. TASA DE EFICIENCIA (Porcentaje) */}
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
            <p className={`text-3xl font-black tabular-nums ${isHealthy ? 'text-violet-600' : 'text-orange-500'}`}>
              {data.savingsRate}%
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Capacidad de reinversión</p>
          </div>
        </div>

        {/* 3. RUNWAY (Tiempo) */}
        <div className="bg-white p-6 rounded-[2.2rem] border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-200 transition-colors">
          <div className="flex items-center justify-between mb-2 text-slate-400">
             <div className="flex items-center gap-2">
                <Clock size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Sobrevivencia</span>
             </div>
             <span className="text-[9px] font-bold text-slate-300 bg-slate-50 px-2 py-0.5 rounded-full uppercase">Meses</span>
          </div>
          <div>
            <p className="text-3xl font-black text-slate-900 tabular-nums">
              {data.runway} <span className="text-lg font-bold text-slate-300">meses</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1 font-medium">Autonomía según gasto actual</p>
          </div>
        </div>
      </div>
    </div>
  );
};