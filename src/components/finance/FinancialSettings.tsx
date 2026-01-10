'use client';
import { useState, useEffect, useRef } from 'react';
import { Wallet, Landmark, PiggyBank, HelpCircle, Target, ArrowDown, Coins, TrendingUp } from 'lucide-react';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { createClient } from '@/lib/supabase/client';

interface FinancialSettingsProps {
  annualBudget: number;
  setAnnualBudget: (val: number) => void;
  monthlyIncome: number;
  setMonthlyIncome: (val: number) => void;
  currentCash: number;
  setCurrentCash: (val: number) => void;
}

const InfoTooltip = ({ text }: { text: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <div 
      className="group relative ml-auto cursor-help focus:outline-none"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onClick={() => setIsVisible(!isVisible)}
      tabIndex={0}
    >
      <HelpCircle size={14} className={`transition-colors ${isVisible ? 'text-emerald-500' : 'text-slate-300'}`} />
      <div className={`
        absolute bottom-full right-0 mb-2 w-60 p-4 bg-slate-900 text-white text-[10px] font-medium leading-relaxed rounded-2xl z-20 shadow-2xl border border-slate-700 transition-all duration-200
        ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-2 scale-95 pointer-events-none'}
      `}>
        {text}
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
  
  const { rates, convertToUSD } = useExchangeRates();
  const [baseCurrency, setBaseCurrency] = useState('CLP');
  const supabase = createClient();
  
  // Estado local para el Runway (Driver principal)
  const [targetRunway, setTargetRunway] = useState<string>('');
  const isEditingRunway = useRef(false);

  // Cargar la moneda base del usuario
  useEffect(() => {
    const loadBaseCurrency = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const { data: profile } = await supabase.from('profiles').select('base_currency').single();
      if (profile?.base_currency) {
        setBaseCurrency(profile.base_currency);
      }
    };
    loadBaseCurrency();
  }, []);

  // 1. SINCRONIZACIÓN INICIAL Y REACTIVA
  useEffect(() => {
    if (!isEditingRunway.current && currentCash > 0 && annualBudget > 0) {
        const monthlySpend = annualBudget / 12;
        const calculatedRunway = (currentCash / monthlySpend).toFixed(1);
        if (calculatedRunway !== targetRunway) {
            setTargetRunway(calculatedRunway);
        }
    }
  }, [currentCash, annualBudget]);

  // 2. MANEJO DEL CAMBIO DE RUNWAY (Cálculo Inverso)
  const handleRunwayChange = (val: string) => {
    setTargetRunway(val);
    isEditingRunway.current = true;

    const months = parseFloat(val);
    if (months > 0 && currentCash > 0) {
        const allowedMonthlySpend = currentCash / months;
        setAnnualBudget(Math.round(allowedMonthlySpend * 12));
    }
    
    setTimeout(() => { isEditingRunway.current = false; }, 1000);
  };

  // 3. MANEJO DE CAMBIO DE CAJA (Recalcula Presupuesto manteniendo Runway)
  const handleCashChange = (val: number) => {
    setCurrentCash(val);
    const months = parseFloat(targetRunway);
    if (months > 0 && val > 0) {
        const allowedMonthlySpend = val / months;
        setAnnualBudget(Math.round(allowedMonthlySpend * 12));
    }
  };

  // Variables derivadas para visualización
  const monthlyBudget = annualBudget / 12;
  const monthlyBudgetUSD = baseCurrency === 'USD' ? monthlyBudget : convertToUSD(monthlyBudget, baseCurrency);
  const monthlyBudgetDisplay = monthlyBudget;
  
  const monthlyIncomeDisplay = monthlyIncome;
  const monthlyIncomeUSD = baseCurrency === 'USD' ? monthlyIncome : convertToUSD(monthlyIncome, baseCurrency);
  
  const projectedSavings = monthlyIncomeDisplay > 0 ? Math.round(((monthlyIncomeDisplay - monthlyBudgetDisplay) / monthlyIncomeDisplay) * 100) : 0;
  const isHealthySavings = projectedSavings >= 20;

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] border border-slate-100 max-w-5xl mx-auto mt-4 md:mt-8 shadow-sm">
      
      {/* HEADER */}
      <div className="text-center mb-12">
        <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-4 text-emerald-600 shadow-sm border border-emerald-100">
          <Target size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">Definición de Objetivos</h3>
        <p className="text-slate-400 mt-2 text-sm font-medium">
          Ajusta tu meta de tiempo y calcularemos tu límite de gasto automáticamente.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        
        {/* 1. CAJA TOTAL (RECURSO) */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 hover:border-blue-200 transition-all flex flex-col group relative">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-1.5 bg-slate-50 rounded-lg text-blue-500">
                    <Coins size={16} /> 
                </div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Liquidez Total</label>
                <InfoTooltip text="Dinero disponible HOY en bancos y efectivo. No incluye propiedades ni inversiones bloqueadas. Es tu 'tanque de combustible'." />
            </div>
            <div className="flex-1 flex items-center">
                <div className="flex items-center gap-2 w-full">
                    <span className="text-2xl text-slate-300 font-black">
                        {baseCurrency === 'USD' ? '$' : ''}
                    </span>
                    <input 
                        type="number" 
                        value={currentCash || ''}
                        onChange={(e) => handleCashChange(Number(e.target.value))}
                        className="w-full bg-transparent font-black text-4xl text-slate-800 outline-none placeholder:text-slate-200"
                        placeholder="0"
                    />
                    <span className="text-2xl font-black text-slate-500">
                        {baseCurrency}
                    </span>
                </div>
            </div>
            {baseCurrency !== 'USD' && currentCash > 0 && (
                <p className="text-[10px] text-slate-400 mt-2 bg-slate-50 py-1 px-3 rounded-full w-fit">
                    ≈ ${convertToUSD(currentCash, baseCurrency).toLocaleString('en-US', {maximumFractionDigits: 0})} USD
                </p>
            )}
            <p className="text-[10px] font-bold text-slate-400 mt-3 bg-slate-50 py-1 px-3 rounded-full w-fit">
                Fondos Disponibles
            </p>
        </div>

        {/* 2. RUNWAY OBJETIVO (META - CONTROLADOR) */}
        <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 text-white flex flex-col relative overflow-hidden shadow-xl ring-4 ring-slate-50">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-full blur-[60px] opacity-10 pointer-events-none -mr-10 -mt-10"></div>
            
            <div className="flex items-center gap-2 mb-6 relative z-10">
                <div className="p-1.5 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/30">
                    <Target size={16} />
                </div>
                <label className="text-xs font-black text-emerald-400 uppercase tracking-widest">Meta de Vida</label>
                <div className="ml-auto opacity-70 hover:opacity-100 transition-opacity">
                    <HelpCircle size={14} className="text-slate-500"/>
                </div>
            </div>

            <div className="flex-1 relative z-10">
                <div className="flex items-baseline gap-2 mb-1">
                    <input 
                        type="number" 
                        value={targetRunway}
                        onChange={(e) => handleRunwayChange(e.target.value)}
                        className="w-28 bg-transparent font-black text-5xl text-white outline-none border-b-2 border-white/20 focus:border-emerald-500 transition-colors pb-1 placeholder:text-white/20"
                        placeholder="0"
                        step="0.1"
                    />
                    <span className="text-xl font-bold text-slate-500">meses</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                    ¿Cuánto tiempo quieres operar con tu liquidez actual sin depender de ventas?
                </p>
            </div>
        </div>

        {/* 3. RESULTADO (PRESUPUESTO PERMITIDO) */}
        <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 flex flex-col relative group cursor-not-allowed">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-1.5 bg-white rounded-lg text-emerald-600 shadow-sm">
                    <ArrowDown size={16} />
                </div>
                <label className="text-xs font-black text-emerald-800 uppercase tracking-widest">Tope de Gasto</label>
                <InfoTooltip text="Este es el límite máximo que puedes gastar al mes para cumplir tu meta de meses de vida." />
            </div>

            <div className="flex-1 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-emerald-600/70 uppercase mb-1">
                    Presupuesto Mensual Calculado
                </p>
                <div className="flex items-center gap-1 opacity-90">
                    <span className="text-2xl text-emerald-300 font-black">
                        {baseCurrency === 'USD' ? '$' : ''}
                    </span>
                    <p className="text-4xl font-black text-emerald-700 tracking-tight">
                        {monthlyBudgetDisplay > 0 && isFinite(monthlyBudgetDisplay) 
                            ? monthlyBudgetDisplay.toLocaleString('en-US', {maximumFractionDigits: 0}) 
                            : '0'}
                    </p>
                    <span className="text-xl font-bold text-emerald-600">
                        {baseCurrency}
                    </span>
                </div>
                
                {baseCurrency !== 'USD' && monthlyBudgetDisplay > 0 && (
                    <p className="text-[10px] text-emerald-600 mt-2 bg-white/60 py-1.5 px-3 rounded-xl w-fit">
                        ≈ ${monthlyBudgetUSD.toLocaleString('en-US', {maximumFractionDigits: 0})} USD
                    </p>
                )}
                
                <p className="text-[10px] font-medium text-emerald-600 mt-2 bg-white/60 py-1.5 px-3 rounded-xl w-fit">
                    Resultado Automático
                </p>
            </div>
        </div>

      </div>

      {/* FOOTER: PROYECCIÓN DE INGRESOS */}
      <div className="border-t border-slate-100 pt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
         <div className="flex items-center gap-4">
             <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 border border-slate-100">
                <Landmark size={24} />
             </div>
             <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Ingreso Mensual (Base)</label>
                <div className="flex items-center gap-1">
                    <span className="text-sm font-bold text-slate-300">
                        {baseCurrency === 'USD' ? '$' : ''}
                    </span>
                    <input 
                        type="number" 
                        value={monthlyIncome || ''}
                        onChange={(e) => setMonthlyIncome(Number(e.target.value))}
                        className="bg-transparent font-bold text-xl text-slate-700 outline-none w-32 placeholder:text-slate-200"
                        placeholder="0"
                    />
                    <span className="text-lg font-bold text-slate-500">
                        {baseCurrency}
                    </span>
                </div>
                {baseCurrency !== 'USD' && monthlyIncome > 0 && (
                    <p className="text-[9px] text-slate-400 font-medium">
                        ≈ ${monthlyIncomeUSD.toLocaleString('en-US', {maximumFractionDigits: 0})} USD
                    </p>
                )}
                <p className="text-[9px] text-slate-300 font-medium">Tus entradas promedio estimadas</p>
             </div>
         </div>

         <div className="bg-slate-50 rounded-2xl p-4 flex items-center justify-between border border-slate-100 shadow-sm">
            <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={12}/> Capacidad de Ahorro
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Proyección según tope de gasto</p>
            </div>
            <p className={`text-3xl font-black ${isHealthySavings ? 'text-emerald-500' : 'text-orange-400'}`}>
                {projectedSavings}%
            </p>
         </div>
      </div>

    </div>
  );
};