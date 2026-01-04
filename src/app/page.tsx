'use client';

import { useState, useMemo } from 'react';
import { 
  Plus, 
  ShieldAlert, 
  Wallet,
  Globe
} from 'lucide-react';

// --- IMPORTACIONES DE COMPONENTES ---
import { Sidebar } from '@/components/layout/Sidebar';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { TimelineFilter } from '@/components/dashboard/TimelineFilter';
import { ScenarioSelector } from '@/components/dashboard/ScenarioSelector';
import { ActionCenter } from '@/components/goals/ActionCenter';
import { QuickEntry } from '@/components/finance/QuickEntry';
import { TransactionManager } from '@/components/finance/transactions/TransactionManager';

// Hook para las monedas
import { useExchangeRates } from '@/hooks/useExchangeRates';

// --- INTERFACES ---
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

  const [periodFilter, setPeriodFilter] = useState<'Mensual' | 'Trimestral' | 'Anual'>('Mensual');
  const [scenario, setScenario] = useState<'base' | 'worst' | 'best'>('base');

  const { rates, loading: ratesLoading } = useExchangeRates();

  const ANNUAL_BUDGET = 31200; 
  const MONTHLY_PLAN = ANNUAL_BUDGET / 12;

  const projectedData = useMemo(() => {
    const rawData = [
      { label: 'Ene', real: 2450 },
      { label: 'Feb', real: 2800 },
      { label: 'Mar', real: 2500 },
      { label: 'Abr', real: 2600 },
    ];

    let expenseMultiplier = 1;
    if (scenario === 'worst') expenseMultiplier = 1.20;
    if (scenario === 'best') expenseMultiplier = 0.90;

    return rawData.map(d => ({
      label: d.label,
      plan: MONTHLY_PLAN,
      real: Math.round(d.real * expenseMultiplier)
    }));
  }, [scenario, MONTHLY_PLAN]);

  const currentRunway = useMemo(() => {
    const baseRunway = 6.2;
    if (scenario === 'worst') return 3.5;
    if (scenario === 'best') return 8.0;
    return baseRunway;
  }, [scenario]);

  const blockers: Task[] = [
    { 
      id: 1, 
      title: 'Habilitar Cuenta Internacional Empresa', 
      completed: false, 
      blocked: true, 
      blockerDescription: 'Banco requiere estatutos apostillados. Trámite demora 10 días.' 
    },
    { 
      id: 2, 
      title: 'Optimizar Costo Fijo Chile', 
      completed: false, 
      blocked: false 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      
      <Sidebar 
        isOpen={sidebarOpen} 
        toggle={() => setSidebarOpen(!sidebarOpen)} 
        activeView={activeView}
        setView={setActiveView}
      />

      <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        
        {/* --- HEADER --- */}
        <header className="flex flex-col xl:flex-row items-center justify-between mb-8 gap-6 relative">
          
          {/* IZQUIERDA: TÍTULO */}
          <div className="w-full xl:w-1/3 text-center xl:text-left">
            <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">
              {activeView === 'dash' ? 'Panel de Control CFO' : 
               activeView === 'transactions' ? 'Gestión de Movimientos' : 'Configuración'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Plan Mensual: <span className="font-medium text-slate-600">${MONTHLY_PLAN.toLocaleString('en-US')}</span>
            </p>
          </div>
          
          {/* CENTRO: TICKER DE MONEDAS (BANDERAS CIRCULARES) */}
          <div className="w-full xl:w-1/3 flex justify-center">
            <div className="flex items-center gap-6 bg-white px-8 py-3 rounded-full border border-slate-200 shadow-sm min-w-fit">
               {ratesLoading ? (
                 <span className="text-xs text-slate-400 font-medium animate-pulse">Sincronizando mercados...</span>
               ) : (
                 <>
                    {/* BRL */}
                    <div className="flex items-center gap-2">
                      <img src="https://flagcdn.com/w40/br.png" alt="br" className="w-5 h-5 rounded-full object-cover border border-slate-100 shadow-sm"/>
                      <div className="flex flex-col leading-none">
                         <span className="text-[9px] font-bold text-slate-400 uppercase">USD/BRL</span>
                         <span className="text-xs font-black text-slate-800">{rates['BRL']?.toFixed(2)}</span>
                      </div>
                    </div>

                    <div className="w-px h-6 bg-slate-100"></div>
                    
                    {/* CLP */}
                    <div className="flex items-center gap-2">
                      <img src="https://flagcdn.com/w40/cl.png" alt="cl" className="w-5 h-5 rounded-full object-cover border border-slate-100 shadow-sm"/>
                      <div className="flex flex-col leading-none">
                         <span className="text-[9px] font-bold text-slate-400 uppercase">USD/CLP</span>
                         <span className="text-xs font-black text-slate-800">{rates['CLP']?.toFixed(0)}</span>
                      </div>
                    </div>

                    <div className="w-px h-6 bg-slate-100"></div>
                    
                    {/* EUR */}
                    <div className="flex items-center gap-2">
                      <img src="https://flagcdn.com/w40/eu.png" alt="eu" className="w-5 h-5 rounded-full object-cover border border-slate-100 shadow-sm"/>
                      <div className="flex flex-col leading-none">
                         <span className="text-[9px] font-bold text-slate-400 uppercase">USD/EUR</span>
                         <span className="text-xs font-black text-slate-800">{rates['EUR']?.toFixed(2)}</span>
                      </div>
                    </div>
                 </>
               )}
            </div>
          </div>

          {/* DERECHA: ACCIONES */}
          <div className="w-full xl:w-1/3 flex justify-center xl:justify-end">
            {activeView === 'dash' && (
              <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
                <ScenarioSelector current={scenario} onChange={setScenario} />
                <div className="px-4 border-l border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Runway</p>
                  <p className={`text-lg font-black ${scenario === 'worst' ? 'text-rose-500' : 'text-slate-900'}`}>
                    {currentRunway}m
                  </p>
                </div>
              </div>
            )}
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {activeView === 'dash' && (
            <>
              <MetricGrid data={{ variance: -150, runway: currentRunway }} />
              <TimelineFilter 
                data={projectedData} 
                period={periodFilter} 
                setPeriod={setPeriodFilter} 
              />
              <div className="pt-2">
                <div className="flex items-center gap-2 mb-4 px-2">
                  <ShieldAlert className="text-rose-500" size={18} />
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Restricciones Operativas</h3>
                </div>
                <ActionCenter tasks={blockers} />
              </div>
            </>
          )}

          {activeView === 'transactions' && (
            <TransactionManager />
          )}

          {activeView === 'settings' && (
            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-100 text-center">
               <Wallet size={48} className="mx-auto text-slate-200 mb-4"/>
               <h3 className="text-lg font-bold text-slate-400">Configuración Financiera</h3>
               <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto">
                 Aquí podrás ajustar el Presupuesto Anual (${ANNUAL_BUDGET.toLocaleString('en-US')}) y conectar tus cuentas bancarias.
               </p>
            </div>
          )}

        </div>
      </main>

      <button 
        onClick={() => setIsEntryOpen(true)}
        className="fixed bottom-10 right-10 bg-slate-900 text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 border-4 border-white"
        title="Ingreso Rápido"
      >
        <Plus size={28} />
      </button>

      <QuickEntry 
        isOpen={isEntryOpen} 
        onClose={() => setIsEntryOpen(false)} 
      />

    </div>
  );
}