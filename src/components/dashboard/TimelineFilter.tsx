// src/components/dashboard/TimelineFilter.tsx
'use client';
import { useState } from 'react';
import { BarChart3, Calendar } from 'lucide-react';

interface PeriodData {
  label: string;
  plan: number;
  real: number;
}

interface TimelineFilterProps {
  data: PeriodData[];
  period: 'Mensual' | 'Trimestral' | 'Anual';
  setPeriod: (p: 'Mensual' | 'Trimestral' | 'Anual') => void;
}

export const TimelineFilter = ({ data, period, setPeriod }: TimelineFilterProps) => {
  const maxVal = Math.max(...data.map(d => Math.max(d.plan, d.real)));

  return (
    <section className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Cumplimiento del Plan</h3>
          <div className="flex gap-2 mt-2 bg-slate-100 p-1 rounded-lg w-fit">
            {['Mensual', 'Trimestral', 'Anual'].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p as any)}
                className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${
                  period === p ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        <BarChart3 className="text-slate-300" size={20} />
      </div>

      {/* Gráfico de Barras Comparativo */}
      <div className="flex items-end justify-between h-40 gap-3">
        {data.map((item, i) => {
          const planHeight = (item.plan / maxVal) * 100;
          const realHeight = (item.real / maxVal) * 100;
          const isOk = item.real >= item.plan; // Asumimos que "Más es mejor" para ahorro/ingreso

          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div className="w-full flex items-end justify-center gap-1 h-full">
                {/* Plan (Gris) */}
                <div className="w-2 bg-slate-200 rounded-t-sm relative group-hover:bg-slate-300 transition-colors" style={{ height: `${planHeight}%` }} />
                {/* Real (Color) */}
                <div 
                  className={`w-3 rounded-t-sm transition-all ${isOk ? 'bg-slate-800' : 'bg-rose-500'}`} 
                  style={{ height: `${realHeight}%` }} 
                />
              </div>
              <span className="text-[9px] font-bold text-slate-400 uppercase truncate w-full text-center">{item.label}</span>
              
              {/* Tooltip simple */}
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-slate-900 text-white text-[9px] p-2 rounded pointer-events-none whitespace-nowrap z-10">
                Plan: ${item.plan} | Real: ${item.real}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};