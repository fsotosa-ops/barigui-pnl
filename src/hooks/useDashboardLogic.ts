'use client';

import { useState, useMemo, useRef } from 'react';
import { Transaction } from '@/types/finance';
import { useExchangeRates } from '@/hooks/useExchangeRates';

export const useDashboardLogic = () => {
  // --- UI STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'dash' | 'transactions' | 'settings'>('dash');
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- BUSINESS STATE ---
  const [transactions, setTransactions] = useState<Transaction[]>([
    { 
      id: '1', date: '2026-01-15', description: 'Ingreso Inicial Simulado', category: 'Sumadots - Retainer', type: 'income',
      originalAmount: 4000, originalCurrency: 'USD', exchangeRate: 1, amountUSD: 4000 
    },
    { 
      id: '2', date: '2026-01-20', description: 'Gasto Inicial Simulado', category: 'Vivienda', type: 'expense',
      originalAmount: 1200, originalCurrency: 'USD', exchangeRate: 1, amountUSD: 1200 
    },
  ]);

  // --- FILTROS & CONFIGURACIÓN ---
  const [periodFilter, setPeriodFilter] = useState<'Mensual' | 'Trimestral' | 'Anual'>('Anual');
  const [scenario, setScenario] = useState<'base' | 'worst' | 'best'>('base');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  
  const [annualBudget, setAnnualBudget] = useState(31200); 
  const [monthlyIncome, setMonthlyIncome] = useState(4500); 
  const [currentCash, setCurrentCash] = useState(18500);    

  const monthlyPlan = annualBudget / 12;
  const { rates } = useExchangeRates(); // Para uso futuro si se requiere

  // --- MEMOS: AÑOS DISPONIBLES ---
  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(2025);
    years.add(2026);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  // --- MEMOS: TRANSACCIONES FILTRADAS ---
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
  }, [transactions, selectedYear]);

  // --- LOGICA SUBIDA ARCHIVOS ---
  const isDuplicate = (newTx: Transaction, currentList: Transaction[]) => {
    return currentList.some(existing => 
      existing.date === newTx.date &&
      Math.abs(existing.originalAmount - newTx.originalAmount) < 1 &&
      existing.description.toLowerCase().trim() === newTx.description.toLowerCase().trim()
    );
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/parse-statement', { method: 'POST', body: formData });
      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const newTransactions: Transaction[] = (data.transactions || []).map((t: any) => ({
        id: Date.now().toString() + Math.random().toString().slice(2, 6),
        date: t.date,
        description: t.description,
        category: t.category,
        type: t.type,
        originalAmount: t.amount,
        originalCurrency: t.currency || 'CLP',
        exchangeRate: 0.00105, 
        amountUSD: t.amountUSD || parseFloat((t.amount * 0.00105).toFixed(2)) 
      }));

      const uniqueTransactions = newTransactions.filter(tx => !isDuplicate(tx, transactions));

      if (uniqueTransactions.length > 0) {
        setTransactions(prev => [...prev, ...uniqueTransactions]);
        const newYear = new Date(uniqueTransactions[0].date).getFullYear();
        if (newYear !== selectedYear) setSelectedYear(newYear);
        alert(`✅ Se importaron ${uniqueTransactions.length} movimientos.`);
      } else {
        alert('⚠️ No hay movimientos nuevos.');
      }
    } catch (error) {
      console.error(error);
      alert('❌ Error al procesar archivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- MEMOS: DATOS GRÁFICO (PROYECCIÓN) ---
  const projectedData = useMemo(() => {
    const monthlyExpenses = new Array(12).fill(0);
    
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        const month = new Date(t.date).getMonth(); 
        if (month >= 0 && month <= 11) {
           monthlyExpenses[month] += t.amountUSD;
        }
      }
    });

    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const baseData = monthLabels.map((label, idx) => ({
      label,
      real: monthlyExpenses[idx]
    }));

    let expenseMultiplier = 1;
    if (scenario === 'worst') expenseMultiplier = 1.20;
    if (scenario === 'best') expenseMultiplier = 0.90;

    let dataToProcess = baseData;
    if (periodFilter === 'Mensual') dataToProcess = baseData.slice(0, 6);

    let accumPlan = 0;
    let accumReal = 0;
    const currentMonthIndex = new Date().getMonth(); 
    const isCurrentYear = selectedYear === new Date().getFullYear();

    return dataToProcess.map((d, i) => {
      accumPlan += monthlyPlan; 
      const shouldShowReal = !isCurrentYear || i <= currentMonthIndex;

      if (shouldShowReal) {
         accumReal += Math.round(d.real * expenseMultiplier);
      } else {
         accumReal += Math.round(monthlyPlan * expenseMultiplier);
      }

      return {
        label: d.label,
        plan: Math.round(accumPlan),
        real: Math.round(accumReal) 
      };
    });
  }, [scenario, monthlyPlan, periodFilter, filteredTransactions, selectedYear]);

  // --- MEMOS: KPIs ---
  const kpiData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const isCurrentYear = selectedYear === new Date().getFullYear();
    let realExpenseForCalc = 0;

    if (isCurrentYear) {
       realExpenseForCalc = filteredTransactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth)
        .reduce((acc, t) => acc + t.amountUSD, 0);
    } else {
       const totalYearExpense = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((acc, t) => acc + t.amountUSD, 0);
       realExpenseForCalc = totalYearExpense / 12;
    }

    const variance = Number((monthlyPlan - realExpenseForCalc).toFixed(0));
    const savingsRate = monthlyIncome > 0 
      ? Math.round(((monthlyIncome - realExpenseForCalc) / monthlyIncome) * 100) 
      : 0;

    const avgBurn = realExpenseForCalc > 0 ? realExpenseForCalc : monthlyPlan;
    const runwayCalc = avgBurn > 0 ? parseFloat((currentCash / avgBurn).toFixed(1)) : 0;

    return { variance, runway: runwayCalc, savingsRate };
  }, [monthlyPlan, currentCash, scenario, monthlyIncome, filteredTransactions, selectedYear]);

  return {
    // UI State
    sidebarOpen, setSidebarOpen,
    activeView, setActiveView,
    isEntryOpen, setIsEntryOpen,
    isUploading, fileInputRef, handleFileUpload,

    // Data State
    transactions, setTransactions,
    
    // Filters & Config
    periodFilter, setPeriodFilter,
    scenario, setScenario,
    selectedYear, setSelectedYear, availableYears,
    annualBudget, setAnnualBudget,
    monthlyIncome, setMonthlyIncome,
    currentCash, setCurrentCash,
    
    // Computed Values
    monthlyPlan,
    projectedData,
    kpiData,
  };
};