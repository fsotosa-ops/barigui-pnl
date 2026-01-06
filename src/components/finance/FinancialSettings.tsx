'use client';
import { useState } from 'react';
import { Wallet, DollarSign, Landmark, PiggyBank, HelpCircle } from 'lucide-react';

interface FinancialSettingsProps {
  annualBudget: number;
  setAnnualBudget: (val: number) => void;
  monthlyIncome: number;
  setMonthlyIncome: (val: number) => void;
  currentCash: number;
  setCurrentCash: (val: number) => void;
}

// Componente Interno de Ayuda mejorado para Mobile
const InfoTooltip = ({ text }: { text: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div 
      className="group relative ml-auto cursor-help focus:outline-none"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
      tabIndex={0} // Permite enfoque por teclado/toque
    >
      <HelpCircle size={14} className={`transition-colors ${isVisible ? 'text-emerald-500' : 'text-slate-300'}`} />
      
      {/* Burbuja del Tooltip */}
      <div className={`
        absolute bottom-full right-0 mb-2 w-56 p-3 bg-slate-900 text-white text-[10px] font-medium leading-relaxed rounded-2xl z-20 shadow-2xl border border-slate-700 transition-all duration-200
        /* Lógica de visibilidad híbrida */
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}
      `}>
        {text}
        {/* Flecha indicadora */}
        <div className="absolute top-full right-1.5 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900"></div>
      </div>
    </div>
  );
};

export const FinancialSettings = ({
  annualBudget,
  setAnnualBudget,
  monthlyIncome,
  setMonthlyIncome,
  currentCash,
  setCurrentCash
}: FinancialSettingsProps) => {
  
  const monthlyPlan = annualBudget / 12;

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 max-w-5xl mx-auto mt-4 md:mt-8 shadow-sm">
      <div className="text-center mb-10">
        <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-4 text-emerald-600 shadow-sm">
          <Wallet size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Variables Financieras</h3>
        <p className="text-slate-400 mt-2 text-sm font-medium italic md:not-italic">Ajusta los parámetros para recalcular tus proyecciones en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* 1. PRESUPUESTO ANUAL */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors group/card relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">
                <DollarSign size={14} />
            </div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Presupuesto Anual</label>
            <InfoTooltip text="Tu techo de gasto máximo para este año. Incluye tanto costos de vida personal como operativos del negocio." />
          </div>
          
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 focus-within:ring-2 ring-emerald-500 transition-all shadow-sm">
            <span className="text-slate-300 font-bold ml-2">$</span>
            <input 
              type="number" 
              value={annualBudget}
              onChange={(e) => setAnnualBudget(Number(e.target.value))}
              className="w-full bg-transparent font-black text-2xl text-slate-800 outline-none text-center"
            />
          </div>
          <p className="text-center text-[10px] font-bold text-slate-400 mt-3 bg-slate-100/50 py-1 px-3 rounded-full w-fit mx-auto">
            Eq. mensual: <span className="text-slate-600">${monthlyPlan.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
          </p>
        </div>

        {/* 2. INGRESO MENSUAL */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors group/card">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-1.5 bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">
                <Landmark size={14} />
             </div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingreso Mensual</label>
            <InfoTooltip text="Promedio de dinero que entra a tu caja cada mes (Sueldo, Retiros, Ventas). Base para calcular tu capacidad de ahorro." />
          </div>
          
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 focus-within:ring-2 ring-emerald-500 transition-all shadow-sm">
            <span className="text-emerald-200 font-bold ml-2">$</span>
            <input 
              type="number" 
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full bg-transparent font-black text-2xl text-emerald-600 outline-none text-center"
            />
          </div>
           <p className="text-center text-[10px] font-bold text-slate-400 mt-3 bg-slate-100/50 py-1 px-3 rounded-full w-fit mx-auto">
            Entradas Recurrentes
          </p>
        </div>

        {/* 3. CAJA ACTUAL (Runway) */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors group/card">
          <div className="flex items-center gap-2 mb-4">
             <div className="p-1.5 bg-white rounded-lg text-slate-400 shadow-sm border border-slate-100">
                <PiggyBank size={14} />
             </div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Caja Total</label>
            <InfoTooltip text="Liquidez total disponible HOY. Suma saldos de cuentas corrientes, efectivo y ahorros de libre disposición." />
          </div>
          
          <div className="flex items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 focus-within:ring-2 ring-emerald-500 transition-all shadow-sm">
            <span className="text-blue-200 font-bold ml-2">$</span>
            <input 
              type="number" 
              value={currentCash}
              onChange={(e) => setCurrentCash(Number(e.target.value))}
              className="w-full bg-transparent font-black text-2xl text-blue-600 outline-none text-center"
            />
          </div>
           <p className="text-center text-[10px] font-bold text-slate-400 mt-3 bg-slate-100/50 py-1 px-3 rounded-full w-fit mx-auto">
            Patrimonio Líquido
          </p>
        </div>

      </div>
    </div>
  );
};