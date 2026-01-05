'use client';

import { useState, useEffect } from 'react';
import { Plus, UploadCloud, Loader2, Calendar } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { TimelineFilter } from '@/components/dashboard/TimelineFilter';
import { RoadmapList } from '@/components/goals/RoadmapList'; 
import { QuickEntry } from '@/components/finance/QuickEntry';
import { TransactionManager } from '@/components/finance/transactions/TransactionManager';
import { CurrencyTicker } from '@/components/dashboard/CurrencyTicker';
import { FinancialSettings } from '@/components/finance/FinancialSettings';
import { CopilotWidget } from '@/components/advisor/CopilotWidget'; // <--- 1. IMPORTAR

import { useDashboardLogic } from '@/hooks/useDashboardLogic';

export default function OperationalDash() {
  const logic = useDashboardLogic();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 2. PREPARAR CONTEXTO PARA EL COPILOT
  const advisorContext = {
    kpi: logic.kpiData,
    budget: logic.annualBudget,
    cash: logic.currentCash,
    topExpenses: logic.transactions
      .filter(t => t.type === 'expense')
      .slice(0, 5)
      .map(t => ({ cat: t.category, amount: t.amountUSD }))
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex selection:bg-emerald-100 selection:text-emerald-900">
      
      <Sidebar 
        isOpen={logic.sidebarOpen} 
        toggle={() => logic.setSidebarOpen(!logic.sidebarOpen)} 
        activeView={logic.activeView} 
        setView={logic.setActiveView} 
        onLogout={logic.handleLogout}
      />

      <main className={`flex-1 transition-all duration-300 ${logic.sidebarOpen ? 'ml-64' : 'ml-24'} p-8 lg:p-12`}>
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-12 gap-6">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
              {logic.activeView === 'dash' ? 'Fluxo Control Centre' : 
               logic.activeView === 'transactions' ? 'Registro de Flujos' : 
               logic.activeView === 'roadmap' ? 'Roadmap Estratégico' : 
               'Parámetros Financieros'}
            </h1>
            <p className="text-sm text-slate-400 mt-1 font-medium">
               {logic.activeView === 'roadmap' ? 'Gestión de Hitos y Prioridades' : 'Gestión Integral de Negocio & Finanzas Personales'}
            </p>
          </div>
          
          <div className="flex items-center gap-4 self-end xl:self-auto">
             <CurrencyTicker />
             
             <div className="relative">
               <input type="file" className="hidden" ref={logic.fileInputRef} onChange={logic.handleFileUpload} accept=".png,.jpg,.jpeg,.csv,.xlsx,.xls" />
               <button 
                 onClick={() => logic.fileInputRef.current?.click()}
                 disabled={logic.isUploading}
                 className="bg-white hover:bg-slate-50 text-slate-800 px-5 py-3 rounded-2xl border border-slate-200 shadow-sm font-bold text-xs flex items-center gap-2 transition-all active:scale-95"
               >
                 {logic.isUploading ? <Loader2 size={16} className="animate-spin text-emerald-500"/> : <UploadCloud size={16} className="text-emerald-500"/>}
                 {logic.isUploading ? 'Analizando...' : 'Importar Datos'}
               </button>
             </div>
          </div>
        </header>

        {/* VISTAS */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-500">
          
          {logic.activeView === 'dash' && (
            <>
              <MetricGrid data={logic.kpiData} />
              
              <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4 z-10 relative">
                    <div className="flex items-center gap-8">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                           <Calendar size={18} className="text-emerald-500"/>
                           Trayectoria de Caja
                        </h3>
                        <div className="flex gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          {['Mensual', 'Trimestral', 'Anual'].map((p) => (
                            <button
                              key={p}
                              onClick={() => logic.setPeriodFilter(p as any)}
                              className={`px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                logic.periodFilter === p ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Periodo:</span>
                            <select 
                              value={logic.selectedYear} 
                              onChange={(e) => logic.setSelectedYear(Number(e.target.value))}
                              className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
                            >
                              {logic.availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-900 p-1.5 rounded-[1.2rem] shadow-lg">
                            <div className="flex gap-1">
                                {(['base', 'worst', 'best'] as const).map((s) => (
                                    <button
                                    key={s}
                                    onClick={() => logic.setScenario(s)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase transition-all ${
                                        logic.scenario === s 
                                        ? 'bg-emerald-500 text-slate-900' 
                                        : 'text-slate-500 hover:text-slate-300'
                                    }`}
                                    >
                                    {s === 'base' ? 'Plan' : s === 'worst' ? 'Crisis' : 'Ideal'}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                 </div>

                 <TimelineFilter 
                    data={logic.projectedData} 
                    period={logic.periodFilter} 
                    setPeriod={logic.setPeriodFilter} 
                    scenario={logic.scenario} 
                    setScenario={logic.setScenario} 
                    runway={logic.kpiData.runway}
                    headless={true} 
                 />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-full max-h-[400px] flex flex-col">
                    <RoadmapList 
                        tasks={logic.tasks} 
                        onAdd={logic.handleAddTask}
                        onToggle={logic.handleToggleTask}
                        onDelete={logic.handleDeleteTask}
                        compact={true} 
                    />
                </div>
                
                <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border border-emerald-100 flex flex-col justify-center text-center">
                    <p className="text-emerald-800 font-black text-lg mb-2">Margen Activo</p>
                    <p className="text-emerald-600 text-sm font-medium mb-4">Disponibilidad mensual de seguridad</p>
                    <p className="text-4xl font-black text-emerald-700">
                      ${mounted ? logic.monthlyPlan.toLocaleString() : logic.monthlyPlan.toString()}
                    </p>
                </div>
              </div>
            </>
          )}

          {logic.activeView === 'roadmap' && (
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[600px]">
                <RoadmapList 
                  tasks={logic.tasks} 
                  onAdd={logic.handleAddTask}
                  onToggle={logic.handleToggleTask}
                  onDelete={logic.handleDeleteTask}
                  compact={false} 
                />
             </div>
          )}

          {logic.activeView === 'transactions' && (
            <TransactionManager 
              transactions={logic.transactions} 
              setTransactions={logic.setTransactions} 
            />
          )}

          {logic.activeView === 'settings' && (
            <FinancialSettings 
              annualBudget={logic.annualBudget} setAnnualBudget={logic.setAnnualBudget}
              monthlyIncome={logic.monthlyIncome} setMonthlyIncome={logic.setMonthlyIncome}
              currentCash={logic.currentCash} setCurrentCash={logic.setCurrentCash}
            />
          )}

        </div>
      </main>

      {/* 3. WIDGETS FLOTANTES */}
      
      <button 
        onClick={() => logic.setIsEntryOpen(true)} 
        className="fixed bottom-10 right-10 bg-slate-900 text-white w-16 h-16 rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-50 border-[6px] border-white group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      {/* Copilot está posicionado a la izquierda del botón de añadir */}
      <CopilotWidget contextData={advisorContext} />
      
      <QuickEntry isOpen={logic.isEntryOpen} onClose={() => logic.setIsEntryOpen(false)} />
    </div>
  );
}