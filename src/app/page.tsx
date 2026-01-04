'use client';

import { Plus, UploadCloud, Loader2, Calendar } from 'lucide-react';

// Componentes Visuales
import { Sidebar } from '@/components/layout/Sidebar';
import { MetricGrid } from '@/components/dashboard/MetricGrid';
import { TimelineFilter } from '@/components/dashboard/TimelineFilter';
import { ActionCenter } from '@/components/goals/ActionCenter';
import { QuickEntry } from '@/components/finance/QuickEntry';
import { TransactionManager } from '@/components/finance/transactions/TransactionManager';
import { CurrencyTicker } from '@/components/dashboard/CurrencyTicker';
import { FinancialSettings } from '@/components/finance/FinancialSettings';

// Importamos nuestra nueva lógica centralizada
import { useDashboardLogic } from '@/hooks/useDashboardLogic';

interface Task {
  id: number;
  title: string;
  completed: boolean;
  blocked: boolean;
  blockerDescription?: string;
}

export default function OperationalDash() {
  // Consumimos toda la lógica del hook
  const logic = useDashboardLogic();

  // Datos estáticos para ActionCenter
  const initialBlockers: Task[] = [
    { id: 1, title: 'Habilitar Cuenta Internacional', completed: false, blocked: true, blockerDescription: 'Banco requiere estatutos.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex">
      
      {/* SIDEBAR CON LOGOUT CONECTADO */}
      <Sidebar 
        isOpen={logic.sidebarOpen} 
        toggle={() => logic.setSidebarOpen(!logic.sidebarOpen)} 
        activeView={logic.activeView} 
        setView={logic.setActiveView} 
        onLogout={logic.handleLogout}
      />

      <main className={`flex-1 transition-all duration-300 ${logic.sidebarOpen ? 'ml-64' : 'ml-20'} p-8`}>
        
        {/* HEADER GLOBAL */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 capitalize tracking-tight">
              {logic.activeView === 'dash' ? 'Panel de Control CFO' : logic.activeView === 'transactions' ? 'Movimientos' : 'Configuración'}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Plan Mensual: <span className="font-medium text-slate-600">${logic.monthlyPlan.toLocaleString('en-US', {maximumFractionDigits: 0})}</span>
            </p>
          </div>
          
          <div className="flex items-center gap-4 self-end xl:self-auto">
             <CurrencyTicker />
             
             {/* BOTÓN SUBIR CARTOLA */}
             <div className="relative">
               <input type="file" className="hidden" ref={logic.fileInputRef} onChange={logic.handleFileUpload} accept=".png,.jpg,.jpeg,.csv,.xlsx,.xls" />
               <button 
                 onClick={() => logic.fileInputRef.current?.click()}
                 disabled={logic.isUploading}
                 className="bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 rounded-full border border-slate-200 shadow-sm font-bold text-xs flex items-center gap-2 transition-all"
               >
                 {logic.isUploading ? <Loader2 size={16} className="animate-spin"/> : <UploadCloud size={16}/>}
                 {logic.isUploading ? 'Procesando...' : 'Subir Cartola'}
               </button>
             </div>
          </div>
        </header>

        {/* CONTENIDO PRINCIPAL */}
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {logic.activeView === 'dash' && (
            <>
              <MetricGrid data={logic.kpiData} />
              
              {/* CONTENEDOR GRÁFICO CON BARRA DE HERRAMIENTAS INTEGRADA */}
              <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden">
                 
                 <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 z-10 relative">
                    <div className="flex items-center gap-6">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                           <Calendar size={18} className="text-slate-400"/>
                           Flujo Acumulado
                        </h3>
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                          {['Mensual', 'Trimestral', 'Anual'].map((p) => (
                            <button
                              key={p}
                              onClick={() => logic.setPeriodFilter(p as any)}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                logic.periodFilter === p ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* SELECTOR DE AÑO INTEGRADO */}
                        <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-400 uppercase">Año:</span>
                            <select 
                              value={logic.selectedYear} 
                              onChange={(e) => logic.setSelectedYear(Number(e.target.value))}
                              className="bg-transparent text-xs font-black text-slate-700 outline-none cursor-pointer appearance-none"
                            >
                              {logic.availableYears.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>

                        <div className="w-px h-6 bg-slate-100 mx-2"></div>

                        {/* ESCENARIOS Y RUNWAY */}
                        <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                            <div className="flex gap-1">
                                {(['base', 'worst', 'best'] as const).map((s) => (
                                    <button
                                    key={s}
                                    onClick={() => logic.setScenario(s)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                                        logic.scenario === s 
                                        ? 'bg-white text-slate-900 shadow-sm' 
                                        : 'text-slate-400 hover:text-slate-600'
                                    }`}
                                    >
                                    {s === 'base' ? 'Base' : s === 'worst' ? 'Crisis' : 'Ideal'}
                                    </button>
                                ))}
                            </div>
                            <div className="w-px h-6 bg-slate-200"></div>
                            <div className="px-3 text-right">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Runway</p>
                              <p className={`text-lg font-black leading-none ${logic.kpiData.runway < 4 ? 'text-rose-500' : 'text-slate-900'}`}>
                                {logic.kpiData.runway}m
                              </p>
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

              <div className="pt-2"><ActionCenter tasks={initialBlockers} /></div>
            </>
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

      <button onClick={() => logic.setIsEntryOpen(true)} className="fixed bottom-10 right-10 bg-slate-900 text-white w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 border-4 border-white"><Plus size={28} /></button>
      <QuickEntry isOpen={logic.isEntryOpen} onClose={() => logic.setIsEntryOpen(false)} />
    </div>
  );
}