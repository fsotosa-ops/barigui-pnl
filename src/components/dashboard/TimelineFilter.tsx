'use client';
import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { ScenarioSelector } from './ScenarioSelector';

interface PeriodData {
  label: string;
  plan: number;
  real: number;
}

interface TimelineFilterProps {
  data: PeriodData[];
  period: 'Mensual' | 'Trimestral' | 'Anual';
  setPeriod: (p: 'Mensual' | 'Trimestral' | 'Anual') => void;
  scenario: 'base' | 'worst' | 'best';
  setScenario: (s: 'base' | 'worst' | 'best') => void;
  runway: number;
  headless?: boolean;
}

export const TimelineFilter = ({ 
  data, 
  period, 
  setPeriod, 
  scenario, 
  setScenario, 
  runway,
  headless = false 
}: TimelineFilterProps) => {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const height = 220;
  const width = 1000;
  const paddingX = 40;
  const paddingY = 30;

  // Calculamos maxVal de forma segura
  const allValues = data.flatMap(d => [d.plan, d.real]);
  const safeMax = allValues.length > 0 ? Math.max(...allValues) : 0;
  const maxVal = (safeMax * 1.15) || 100;
  
  const getX = (index: number) => {
    if (data.length <= 1) return paddingX; 
    return (index / (data.length - 1)) * (width - paddingX * 2) + paddingX;
  };
  
  const getY = (value: number) => {
    if (isNaN(value)) return height - paddingY;
    return height - ((value / maxVal) * (height - paddingY * 2)) - paddingY;
  };

  // Generador de Curvas
  const buildPath = (key: 'plan' | 'real') => {
    if (data.length === 0) return '';
    let d = `M ${getX(0)} ${getY(data[0][key])}`;
    for (let i = 1; i < data.length; i++) {
        const x = getX(i);
        const y = getY(data[i][key]);
        const prevX = getX(i - 1);
        const prevY = getY(data[i - 1][key]);
        const cp1x = prevX + (x - prevX) / 2;
        const cp2x = prevX + (x - prevX) / 2;
        d += ` C ${cp1x} ${prevY}, ${cp2x} ${y}, ${x} ${y}`;
    }
    return d;
  };

  const buildArea = (pathD: string) => {
      if (!pathD) return '';
      return `${pathD} L ${getX(data.length - 1)} ${height} L ${getX(0)} ${height} Z`;
  };

  const planPath = buildPath('plan');
  const realPath = buildPath('real');
  
  const lastPoint = data[data.length - 1] || { real: 0, plan: 0 };
  const isOverBudget = lastPoint.real > lastPoint.plan;
  const themeColor = isOverBudget ? '#f43f5e' : '#10b981'; 

  if (data.length === 0) {
    return (
      <section className={headless ? "relative w-full" : "bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden"}>
         <div className="h-[220px] flex flex-col items-center justify-center text-slate-300">
            <p className="text-sm font-bold">Sin datos para proyectar</p>
            <p className="text-xs">Ajusta tus variables o agrega movimientos</p>
         </div>
      </section>
    );
  }

  return (
    <section className={headless ? "relative w-full" : "bg-white p-4 md:p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden"}>
      
      {!headless && (
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 z-10 relative">
          {/* ... Header (sin cambios aquí, se maneja en page.tsx) ... */}
        </div>
      )}

      {/* SVG del Gráfico RESPONSIVE */}
      <div className="relative w-full h-[220px]">
        <svg 
            viewBox={`0 0 ${width} ${height}`} 
            preserveAspectRatio="none" 
            className="w-full h-full overflow-visible"
        >
            <defs>
                <linearGradient id="gradientReal" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={themeColor} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={themeColor} stopOpacity="0.05" />
                </linearGradient>
                <linearGradient id="gradientPlan" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.05" />
                </linearGradient>
            </defs>

            {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                <line key={tick} x1="0" y1={getY(maxVal * tick)} x2={width} y2={getY(maxVal * tick)} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            ))}

            <path d={buildArea(planPath)} fill="url(#gradientPlan)" />
            <path d={planPath} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4 4" vectorEffect="non-scaling-stroke" />

            <path d={buildArea(realPath)} fill="url(#gradientReal)" />
            <path d={realPath} fill="none" stroke={themeColor} strokeWidth="3" strokeLinecap="round" vectorEffect="non-scaling-stroke" />

            {/* Puntos interactivos - Ajustados para mobile */}
            {data.map((d, i) => (
                <g key={i} onMouseEnter={() => setHoverIndex(i)} onMouseLeave={() => setHoverIndex(null)}>
                    {/* Área de toque más grande para dedo */}
                    <circle cx={getX(i)} cy={getY(d.real)} r="40" fill="transparent" cursor="pointer" />
                    <circle 
                        cx={getX(i)} cy={getY(d.real)} 
                        r={hoverIndex === i ? 8 : 0} // Punto más grande al tocar
                        fill="white" stroke={themeColor} strokeWidth="3"
                        className="transition-all duration-200"
                        vectorEffect="non-scaling-stroke"
                    />
                </g>
            ))}
        </svg>

        {/* Etiquetas Eje X - Ocultamos algunas en móvil si son muchas */}
        <div className="flex justify-between px-2 mt-2 w-full absolute bottom-0 left-0">
            {data.map((d, i) => (
                <span key={i} className={`text-[8px] md:text-[9px] font-bold text-slate-300 uppercase w-8 text-center ${
                   // En móvil, si hay más de 6 datos, ocultamos los impares para que no se solapen
                   data.length > 6 && i % 2 !== 0 ? 'hidden md:block' : 'block'
                }`}>
                    {d.label}
                </span>
            ))}
        </div>

        {/* TOOLTIP INTELIGENTE */}
        {hoverIndex !== null && data[hoverIndex] && (
            <div 
                className="absolute top-0 pointer-events-none bg-slate-900/95 backdrop-blur text-white p-3 rounded-xl shadow-2xl z-50 transition-all duration-100 min-w-[120px]"
                style={{ 
                    left: `${(hoverIndex / (data.length - 1)) * 100}%`, 
                    top: '10%',
                    // Lógica para que el tooltip no se salga de la pantalla
                    transform: hoverIndex < 2 ? 'translate(5%, 0)' : 
                               hoverIndex > data.length - 3 ? 'translate(-105%, 0)' : 
                               'translate(-50%, -100%)' 
                }}
            >
                <p className="text-[9px] font-bold text-slate-400 mb-1 uppercase tracking-widest border-b border-slate-700 pb-1">
                    {data[hoverIndex].label}
                </p>
                <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center gap-2">
                       <span className="text-slate-400">Plan</span> 
                       <span className="font-mono font-medium">${data[hoverIndex].plan.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center gap-2">
                       <span className="text-slate-400">Real</span> 
                       <span className={`font-mono font-bold ${data[hoverIndex].real > data[hoverIndex].plan ? 'text-rose-400' : 'text-emerald-400'}`}>
                         ${data[hoverIndex].real.toLocaleString()}
                       </span>
                    </div>
                </div>
            </div>
        )}
      </div>
    </section>
  );
};