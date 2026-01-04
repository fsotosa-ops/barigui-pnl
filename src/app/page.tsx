'use client';

import { useState, useMemo } from 'react';
import { Plus, ShieldAlert, Wallet } from 'lucide-react';

// Components
import { Sidebar } from '@/components/layout/Sidebar';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { TimelineFilter } from '@/components/dashboard/TimelineFilter';
import { ActionCenter } from '@/components/goals/ActionCenter';
import { QuickEntry } from '@/components/finance/QuickEntry';
import { TransactionManager } from '@/components/finance/transactions/TransactionManager';
import { CurrencyTicker } from '@/components/dashboard/CurrencyTicker'; // IMPORTADO

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

  const [annualBudget, setAnnualBudget] = useState(31200); 
  const monthlyPlan = annualBudget / 12;
  const currentCash = 18500; // SIMULACIÓN: Caja actual disponible

  // --- CÁLCULO ACUMULATIVO REAL ---
  const projectedData = useMemo(() => {
    // Simulamos datos reales solo hasta el mes actual (Digamos Junio)
    const baseMonths = [
      { label: 'Ene', real: 2450 }, { label: 'Feb', real: 2800 },
      { label: 'Mar', real: 2500 }, { label: 'Abr', real: 2600 },
      { label: 'May', real: 2600 }, { label: 'Jun', real: 2700 },
      { label: 'Jul', real: 0 },    { label: 'Ago', real: 0 }, // Futuro = 0
      { label: 'Sep', real: 0 },    { label: 'Oct', real: 0 },
      { label: 'Nov', real: 0 },    { label: 'Dic', real: 0 },
    ];

    let expenseMultiplier = 1;
    if (scenario === 'worst') expenseMultiplier = 1.20;
    if (scenario === 'best') expenseMultiplier = 0.90;

    let dataToProcess: { label: string; real: number }[] = baseMonths;
    // ... (Aquí iría la lógica de filtro Mensual/Trimestral si la necesitas, igual que antes)

    let accumPlan = 0;
    let accumReal = 0;
    // Mes actual simulado (índice 5 = Junio)
    const currentMonthIndex = 5; 

    return dataToProcess.map((d, index) => {
      accumPlan += monthlyPlan; 
      
      // Solo sumamos al real si estamos en el pasado/presente
      if (index <= currentMonthIndex) {
          accumReal += Math.round(d.real * expenseMultiplier);
      } else {
          // Para meses futuros, proyectamos el plan ajustado por escenario (Opcional)
          // O simplemente dejamos el real estático para mostrar que "falta vivirlo"
          accumReal += Math.round(monthlyPlan * expenseMultiplier); 
      }

      return {
        label: d.label,
        plan: Math.round(accumPlan),
        real: Math.round(accumReal)
      };
    });
  }, [scenario, monthlyPlan]);

  // --- CÁLCULO RUNWAY REAL ---
  const currentRunway = useMemo(() => {
    // Gasto mensual proyectado según escenario
    let projectedMonthlyBurn = monthlyPlan;
    if (scenario === 'worst') projectedMonthlyBurn *= 1.20;
    if (scenario === 'best') projectedMonthlyBurn *= 0.90;

    // Runway = Caja / Gasto Mensual
    return parseFloat((currentCash / projectedMonthlyBurn).toFixed(1));
  }, [scenario, monthlyPlan, currentCash]);

  const initialBlockers: Task[] = [
    { id: 1, title: 'Habilitar Cuenta Internacional', completed: false, blocked: true, blockerDescription: 'Banco requiere estatutos.' },
    { id: 2, title: 'Optimizar Costo Fijo Chile', completed: false, blocked: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      <Sidebar isOpen={sidebarOpen} toggle={() => setSidebarOpen(!sidebarOpen)} activeView={activeView} setView={setActiveView} />

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">
              {activeView === 'dash' ? 'Panel de Control CFO' : activeView === 'transactions' ? 'Movimientos' : 'Configuración'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Plan Mensual: <span className="font-medium text-slate-600">${monthlyPlan.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
            </p>
          </div>
          
          {/* COMPONENTE WIDGET DE MONEDAS */}
          <div className="self-end xl:self-auto">
             <CurrencyTicker />
          </div>
        </header>

        {/* CONTENIDO */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {activeView === 'dash' && (
            <>
              <MetricGrid data={{ variance: -150, runway: currentRunway }} />
              
              <TimelineFilter 
                data={projectedData} 
                period={periodFilter} 
                setPeriod={setPeriodFilter}
                scenario={scenario}
                setScenario={setScenario}
                runway={currentRunway}
              />

              <div className="pt-2">
                <ActionCenter tasks={initialBlockers} />
              </div>
            </>
          )}

          {activeView === 'transactions' && <TransactionManager />}

          {activeView === 'settings' && (
            <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 max-w-3xl mx-auto mt-8 shadow-sm">
               {/* ... (Contenido de Settings igual) ... */}
               <div className="text-center mb-8">
                  <div className="inline-flex p-4 bg-emerald-50 rounded-full mb-4 text-emerald-600"><Wallet size={40} /></div>
                  <h3 className="text-2xl font-black text-slate-900">Configuración Financiera</h3>
               </div>
               <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3">Presupuesto Anual (USD)</label>
                  <input type="number" value={annualBudget} onChange={(e) => setAnnualBudget(Number(e.target.value))} className="w-full bg-white p-3 rounded-xl font-black text-2xl text-slate-800 outline-none border focus:border-emerald-500" />
               </div>
            </div>
          )}

        </div>
      </main>

      <button onClick={() => setIsEntryOpen(true)} className="fixed bottom-10 right-10 bg-slate-900 text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 border-4 border-white"><Plus size={28} /></button>
      <QuickEntry isOpen={isEntryOpen} onClose={() => setIsEntryOpen(false)} />
    </div>
  );
}