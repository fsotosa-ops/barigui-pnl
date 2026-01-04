'use client';

import { useState, useMemo } from 'react';
import { Plus, ShieldAlert } from 'lucide-react';

// Componentes
import { Sidebar } from '@/components/layout/Sidebar';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { TimelineFilter } from '@/components/dashboard/TimelineFilter';
import { ActionCenter } from '@/components/goals/ActionCenter';
import { QuickEntry } from '@/components/finance/QuickEntry';
import { TransactionManager } from '@/components/finance/transactions/TransactionManager';
import { CurrencyTicker } from '@/components/dashboard/CurrencyTicker';
// IMPORTAMOS EL NUEVO MODULO
import { FinancialSettings } from '@/components/finance/FinancialSettings';

import { useExchangeRates } from '@/hooks/useExchangeRates';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  blocked: boolean;
  blockerDescription?: string;
}

export default function OperationalDash() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'dash' | 'transactions' | 'settings'>('dash');
  const [isEntryOpen, setIsEntryOpen] = useState(false);

  const [periodFilter, setPeriodFilter] = useState<'Mensual' | 'Trimestral' | 'Anual'>('Anual');
  const [scenario, setScenario] = useState<'base' | 'worst' | 'best'>('base');

  // --- VARIABLES FINANCIERAS (ESTADO) ---
  // Están inicializadas con valores "quemados" para que veas algo al cargar la página
  const [annualBudget, setAnnualBudget] = useState(31200); 
  const [monthlyIncome, setMonthlyIncome] = useState(4500); 
  const [currentCash, setCurrentCash] = useState(18500);    

  const monthlyPlan = annualBudget / 12;
  const { rates, loading: ratesLoading } = useExchangeRates();

  // --- LÓGICA DE PROYECCIÓN ---
  const projectedData = useMemo(() => {
    const baseMonths = [
      { label: 'Ene', real: 2450 }, { label: 'Feb', real: 2800 },
      { label: 'Mar', real: 2500 }, { label: 'Abr', real: 2600 },
      { label: 'May', real: 2600 }, { label: 'Jun', real: 2700 },
      { label: 'Jul', real: 0 },    { label: 'Ago', real: 0 },
      { label: 'Sep', real: 0 },    { label: 'Oct', real: 0 },
      { label: 'Nov', real: 0 },    { label: 'Dic', real: 0 },
    ];

    let expenseMultiplier = 1;
    if (scenario === 'worst') expenseMultiplier = 1.20;
    if (scenario === 'best') expenseMultiplier = 0.90;

    let dataToProcess: { label: string; real: number }[] = [];

    if (periodFilter === 'Mensual') {
      dataToProcess = baseMonths.slice(0, 6);
    } else if (periodFilter === 'Trimestral') {
      const quarters = [
        { label: 'Q1', months: [0, 1, 2] },
        { label: 'Q2', months: [3, 4, 5] },
        { label: 'Q3', months: [6, 7, 8] },
        { label: 'Q4', months: [9, 10, 11] },
      ];
      dataToProcess = quarters.map(q => {
        const sumReal = q.months.reduce((acc, idx) => acc + (baseMonths[idx]?.real || 0), 0);
        return { label: q.label, real: sumReal };
      });
    } else {
      dataToProcess = baseMonths;
    }

    let accumPlan = 0;
    let accumReal = 0;
    const stepPlan = periodFilter === 'Trimestral' ? monthlyPlan * 3 : monthlyPlan;

    return dataToProcess.map((d) => {
      accumPlan += stepPlan; 
      if (d.real > 0) {
          accumReal += Math.round(d.real * expenseMultiplier);
      } 
      return {
        label: d.label,
        plan: Math.round(accumPlan),
        real: Math.round(accumReal) 
      };
    });
  }, [scenario, monthlyPlan, periodFilter]);

  // --- KPIs ---
  const currentRunway = useMemo(() => {
    let projectedMonthlyBurn = monthlyPlan;
    if (scenario === 'worst') projectedMonthlyBurn *= 1.20;
    if (scenario === 'best') projectedMonthlyBurn *= 0.90;
    
    if (projectedMonthlyBurn === 0) return 0;
    return parseFloat((currentCash / projectedMonthlyBurn).toFixed(1));
  }, [scenario, monthlyPlan, currentCash]);

  const kpiData = useMemo(() => {
    let currentMonthExpense = 2700; // Simulado
    if (scenario === 'worst') currentMonthExpense *= 1.2;
    if (scenario === 'best') currentMonthExpense *= 0.9;

    const variance = Number((monthlyPlan - currentMonthExpense).toFixed(0));
    const savingsRate = monthlyIncome > 0 
      ? Math.round(((monthlyIncome - currentMonthExpense) / monthlyIncome) * 100) 
      : 0;

    return { variance, runway: currentRunway, savingsRate };
  }, [monthlyPlan, currentRunway, scenario, monthlyIncome]);

  const initialBlockers: Task[] = [
    { id: 1, title: 'Habilitar Cuenta Internacional', completed: false, blocked: true, blockerDescription: 'Banco requiere estatutos.' },
    { id: 2, title: 'Optimizar Costo Fijo Chile', completed: false, blocked: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} activeView={activeView} setView={setActiveView} />

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">
              {activeView === 'dash' ? 'Panel de Control CFO' : activeView === 'transactions' ? 'Movimientos' : 'Configuración'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Plan Mensual: <span className="font-medium text-slate-600">${monthlyPlan.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
            </p>
          </div>
          <div className="self-end xl:self-auto"><CurrencyTicker /></div>
        </header>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {activeView === 'dash' && (
            <>
              <MetricGrid data={kpiData} />
              <TimelineFilter 
                data={projectedData} 
                period={periodFilter} 
                setPeriod={setPeriodFilter}
                scenario={scenario}
                setScenario={setScenario}
                runway={currentRunway}
              />
              <div className="pt-2"><ActionCenter tasks={initialBlockers} /></div>
            </>
          )}

          {activeView === 'transactions' && <TransactionManager />}

          {/* COMPONENTE MODULARIZADO */}
          {activeView === 'settings' && (
            <FinancialSettings 
              annualBudget={annualBudget}
              setAnnualBudget={setAnnualBudget}
              monthlyIncome={monthlyIncome}
              setMonthlyIncome={setMonthlyIncome}
              currentCash={currentCash}
              setCurrentCash={setCurrentCash}
            />
          )}

        </div>
      </main>

      <button onClick={() => setIsEntryOpen(true)} className="fixed bottom-10 right-10 bg-slate-900 text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 border-4 border-white"><Plus size={28} /></button>
      <QuickEntry isOpen={isEntryOpen} onClose={() => setIsEntryOpen(false)} />
    </div>
  );
}