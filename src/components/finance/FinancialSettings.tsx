'use client';
import { Wallet, DollarSign, Landmark, PiggyBank } from 'lucide-react';

interface FinancialSettingsProps {
  annualBudget: number;
  setAnnualBudget: (val: number) => void;
  monthlyIncome: number;
  setMonthlyIncome: (val: number) => void;
  currentCash: number;
  setCurrentCash: (val: number) => void;
}

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
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 max-w-4xl mx-auto mt-8 shadow-sm">
      <div className="text-center mb-10">
        <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-4 text-emerald-600">
          <Wallet size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900">Variables Financieras</h3>
        <p className="text-slate-400 mt-2">Ajusta los parámetros para recalcular tus proyecciones en tiempo real.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        
        {/* 1. PRESUPUESTO ANUAL */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={16} className="text-slate-400"/>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Presupuesto Anual</label>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-2 ring-emerald-500 transition-all">
            <input 
              type="number" 
              value={annualBudget}
              onChange={(e) => setAnnualBudget(Number(e.target.value))}
              className="w-full bg-transparent p-2 font-black text-2xl text-slate-800 outline-none text-center"
            />
          </div>
          <p className="text-center text-xs font-bold text-slate-400 mt-3">
            ${monthlyPlan.toLocaleString('en-US', {maximumFractionDigits: 0})} / mes
          </p>
        </div>

        {/* 2. INGRESO MENSUAL */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <Landmark size={16} className="text-slate-400"/>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ingreso Mensual</label>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-2 ring-emerald-500 transition-all">
            <input 
              type="number" 
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(Number(e.target.value))}
              className="w-full bg-transparent p-2 font-black text-2xl text-emerald-600 outline-none text-center"
            />
          </div>
          <p className="text-center text-xs font-bold text-slate-400 mt-3">
            Base para Tasa de Ahorro
          </p>
        </div>

        {/* 3. CAJA ACTUAL (Runway) */}
        <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-slate-300 transition-colors">
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank size={16} className="text-slate-400"/>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Caja Total</label>
          </div>
          <div className="flex items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 focus-within:ring-2 ring-emerald-500 transition-all">
            <input 
              type="number" 
              value={currentCash}
              onChange={(e) => setCurrentCash(Number(e.target.value))}
              className="w-full bg-transparent p-2 font-black text-2xl text-blue-600 outline-none text-center"
            />
          </div>
          <p className="text-center text-xs font-bold text-slate-400 mt-3">
            Base para cálculo de Runway
          </p>
        </div>

      </div>
    </div>
  );
};