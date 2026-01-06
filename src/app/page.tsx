'use client';

import { useState, useEffect, useMemo } from 'react';
import { Plus, UploadCloud, Loader2, Calendar, Menu } from 'lucide-react';

// Layout & Visuals
import { Sidebar } from '@/components/layout/Sidebar';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { TimelineFilter } from '@/components/dashboard/TimelineFilter';
import { CurrencyTicker } from '@/components/dashboard/CurrencyTicker';

// Functional Components
import { RoadmapList } from '@/components/goals/RoadmapList'; 
import { QuickEntry } from '@/components/finance/QuickEntry';
import { TransactionManager } from '@/components/finance/transactions/TransactionManager';
import { FinancialSettings } from '@/components/finance/FinancialSettings';
import { CopilotWidget } from '@/components/advisor/CopilotWidget';
import { ProcessNotification } from '@/components/ui/ProcessNotification';

// Logic Hook
import { useDashboardLogic } from '@/hooks/useDashboardLogic';

export default function OperationalDash() {
  const logic = useDashboardLogic();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // --- PREPARACIÓN DE DATOS PARA EL CEREBRO DE LA IA ---
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    logic.transactions.forEach(t => {
        if (t.type === 'expense') {
            breakdown[t.category] = (breakdown[t.category] || 0) + t.amountUSD;
        }
    });
    // Convertir a array ordenado para el prompt
    return Object.entries(breakdown)
        .map(([cat, amount]) => ({ category: cat, total: Math.round(amount) }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5); // Top 5 gastos
  }, [logic.transactions]);

  const advisorContext = {
    kpi: logic.kpiData,
    budget: { 
        annual: logic.annualBudget, 
        monthly_limit: Math.round(logic.annualBudget / 12),
        current_cash: logic.currentCash,
        monthly_income: logic.monthlyIncome
    },
    spending_analysis: {
        top_expenses: categoryBreakdown,
        total_expense_last_30_days: categoryBreakdown.reduce((acc, curr) => acc + curr.total, 0)
    },
    activeTasks: logic.tasks.filter(t => !t.completed).map(t => ({ title: t.title, priority: t.impact })),
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      
      <Sidebar 
        isOpen={logic.sidebarOpen} 
        toggle={() => logic.setSidebarOpen(!logic.sidebarOpen)} 
        activeView={logic.activeView} 
        setView={logic.setActiveView} 
        onLogout={logic.handleLogout}
      />

      <main className={`
        flex-1 transition-all duration-300 w-full max-w-[100vw]
        ml-0 
        ${logic.sidebarOpen ? 'md:ml-64' : 'md:ml-24'} 
        p-4 md:p-8 lg:p-12
        overflow-x-hidden
      `}>
        
        {/* HEADER MÓVIL */}
        <div className="md:hidden flex items-center justify-between mb-6 sticky top-0 bg-slate-50/95 backdrop-blur-md z-30 py-3 -mx-4 px-4 border-b border-slate-100">
            <button 
                onClick={() => logic.setSidebarOpen(true)}
                className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 shadow-sm active:scale-95 transition-transform"
            >
                <Menu size={24} />
            </button>
            <span className="font-black text-xl tracking-tighter">
                FLUXO<span className="text-emerald-500">.</span>
            </span>
            <div className="w-10"></div> 
        </div>
        
        {/* HEADER DESKTOP Y CONTROLES */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
          <div className="hidden md:block">
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
          
          <div className="md:hidden w-full">
              <h2 className="text-2xl font-black text-slate-800 mb-1">
                {logic.activeView === 'dash' ? 'Resumen' : 
                 logic.activeView === 'transactions' ? 'Movimientos' : 
                 logic.activeView === 'roadmap' ? 'Roadmap' : 
                 'Ajustes'}
              </h2>
              <p className="text-xs text-slate-400 font-medium">Vista general de estado</p>
          </div>
          
          <div className="flex flex-col w-full xl:w-auto gap-4">
             <CurrencyTicker />
             
             <div className="relative w-full">
               <input type="file" className="hidden" ref={logic.fileInputRef} onChange={logic.handleFileUpload} accept=".png,.jpg,.jpeg,.csv,.xlsx,.xls" />
               <button 
                 onClick={() => logic.fileInputRef.current?.click()}
                 disabled={logic.isUploading}
                 className="w-full bg-white hover:bg-slate-50 text-slate-800 px-5 py-4 rounded-2xl border border-slate-200 shadow-sm font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
               >
                 {logic.isUploading ? <Loader2 size={18} className="animate-spin text-emerald-500"/> : <UploadCloud size={18} className="text-emerald-500"/>}
                 {logic.isUploading ? 'Analizando...' : 'Importar Datos'}
               </button>
             </div>
          </div>
        </header>

        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-500 pb-24">
          
          {/* VISTA DASHBOARD */}
          {logic.activeView === 'dash' && (
            <>
              <MetricGrid data={logic.kpiData} />
              
              {/* CHART CARD */}
              <div className="bg-white p-5 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                 
                 <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-6 z-10 relative">
                    <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 shrink-0">
                           <Calendar size={18} className="text-emerald-500"/>
                           Trayectoria
                        </h3>
                        <div className="flex flex-wrap gap-1 bg-slate-50 p-1 rounded-xl border border-slate-100">
                          {['Mensual', 'Trimestral', 'Anual'].map((p) => (
                            <button
                              key={p}
                              onClick={() => logic.setPeriodFilter(p as any)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                logic.periodFilter === p ? 'bg-white shadow-md text-slate-900' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
                        <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shrink-0">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Año:</span>
                            <select 
                              value={logic.selectedYear} 
                              onChange={(e) => logic.setSelectedYear(Number(e.target.value))}
                              className="bg-transparent text-xs font-black text-slate-800 outline-none cursor-pointer"
                            >
                              {logic.availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-1.5 rounded-2xl shadow-lg">
                            {(['base', 'worst', 'best'] as const).map((s) => (
                                <button
                                key={s}
                                onClick={() => logic.setScenario(s)}
                                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-all ${
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

                 <div className="overflow-x-auto -mx-5 px-5 md:mx-0 md:px-0 no-scrollbar">
                    <div className="min-w-[600px] md:min-w-0">
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
                 </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm h-full max-h-[500px] flex flex-col">
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
             <div className="bg-white p-4 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[600px]">
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
              onAdd={logic.handleAddTransaction}
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

      <button 
        onClick={() => logic.setIsEntryOpen(true)} 
        className="fixed bottom-8 right-6 md:bottom-10 md:right-10 bg-slate-900 text-white w-14 h-14 md:w-16 md:h-16 rounded-[1.5rem] shadow-2xl flex items-center justify-center hover:scale-110 active:scale-90 transition-all z-40 border-[4px] md:border-[6px] border-white group"
      >
        <Plus size={32} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>

      <CopilotWidget contextData={advisorContext} />
      
      <QuickEntry 
        isOpen={logic.isEntryOpen} 
        onClose={() => logic.setIsEntryOpen(false)} 
        onAdd={logic.handleAddTransaction}
      />

      <ProcessNotification 
        isOpen={logic.notification.isOpen}
        onClose={logic.closeNotification}
        type={logic.notification.type}
        title={logic.notification.title}
        details={logic.notification.details}
      />

    </div>
  );
}