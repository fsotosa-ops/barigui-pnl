'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Transaction } from '@/types/finance';
import { useExchangeRates } from '@/hooks/useExchangeRates';

export const useDashboardLogic = () => {
  const router = useRouter();
  const supabase = createClient();

  // --- UI STATE ---
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeView, setActiveView] = useState<'dash' | 'transactions' | 'settings'>('dash');
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- DATA STATE ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [periodFilter, setPeriodFilter] = useState<'Mensual' | 'Trimestral' | 'Anual'>('Anual');
  const [scenario, setScenario] = useState<'base' | 'worst' | 'best'>('base');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // Variables financieras (Persistidas en tabla 'profiles')
  const [annualBudget, setAnnualBudget] = useState(31200); 
  const [monthlyIncome, setMonthlyIncome] = useState(4500); 
  const [currentCash, setCurrentCash] = useState(18500);    

  const { rates } = useExchangeRates();
  const monthlyPlan = annualBudget / 12;

  // --- CARGA DE DATOS DESDE SUPABASE ---
  useEffect(() => {
    const loadAllData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Cargar Perfil
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .single();
      
      if (profile) {
        setAnnualBudget(Number(profile.annual_budget));
        setMonthlyIncome(Number(profile.monthly_income));
        setCurrentCash(Number(profile.current_cash));
      } else {
        // Crear perfil inicial si no existe
        await supabase.from('profiles').insert([{ id: user.id }]);
      }

      // 2. Cargar Transacciones
      const { data: txs } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      
      if (txs) {
        // Mapear snake_case de DB a camelCase de App
        const mapped: Transaction[] = txs.map(t => ({
          id: t.id,
          date: t.date,
          description: t.description,
          category: t.category,
          type: t.type,
          originalAmount: Number(t.original_amount),
          originalCurrency: t.original_currency,
          exchangeRate: Number(t.exchange_rate),
          amountUSD: Number(t.amount_usd)
        }));
        setTransactions(mapped);
      }
    };

    loadAllData();
  }, [supabase]);

  // --- PERSISTENCIA ---
  const updateFinancialProfile = async (updates: { annual_budget?: number, monthly_income?: number, current_cash?: number }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('profiles').update(updates).eq('id', user.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map(t => new Date(t.date).getFullYear()));
    years.add(2025);
    years.add(2026);
    return Array.from(years).sort((a, b) => b - a);
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
  }, [transactions, selectedYear]);

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

      const { data: { user } } = await supabase.auth.getUser();

      const newTransactions = (data.transactions || []).map((t: any) => ({
        user_id: user?.id,
        date: t.date,
        description: t.description,
        category: t.category,
        type: t.type,
        original_amount: t.amount,
        original_currency: t.currency || 'CLP',
        exchange_rate: 0.00105, 
        amount_usd: t.amountUSD || parseFloat((t.amount * 0.00105).toFixed(2)) 
      }));

      const { data: saved, error } = await supabase.from('transactions').insert(newTransactions).select();
      
      if (error) throw error;
      
      if (saved) {
        // Recargar localmente
        const mapped: Transaction[] = saved.map(t => ({
          id: t.id, date: t.date, description: t.description, category: t.category,
          type: t.type, originalAmount: t.original_amount, originalCurrency: t.original_currency,
          exchangeRate: t.exchange_rate, amountUSD: t.amount_usd
        }));
        setTransactions(prev => [...mapped, ...prev]);
        alert(`✅ Se importaron ${saved.length} movimientos.`);
      }
    } catch (error) {
      console.error(error);
      alert('❌ Error al procesar archivo.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const projectedData = useMemo(() => {
    const monthlyExpenses = new Array(12).fill(0);
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        const month = new Date(t.date).getUTCMonth(); 
        if (month >= 0 && month <= 11) monthlyExpenses[month] += t.amountUSD;
      }
    });

    const monthLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    let expenseMultiplier = scenario === 'worst' ? 1.20 : scenario === 'best' ? 0.90 : 1;
    let dataToProcess = periodFilter === 'Mensual' ? monthLabels.slice(0, 6) : monthLabels;

    let accumPlan = 0;
    let accumReal = 0;
    const currentMonthIndex = new Date().getMonth(); 
    const isCurrentYear = selectedYear === new Date().getFullYear();

    return dataToProcess.map((label, i) => {
      accumPlan += monthlyPlan; 
      const shouldShowReal = !isCurrentYear || i <= currentMonthIndex;
      if (shouldShowReal) {
         accumReal += Math.round(monthlyExpenses[i] * expenseMultiplier);
      } else {
         accumReal += Math.round(monthlyPlan * expenseMultiplier);
      }
      return { label, plan: Math.round(accumPlan), real: Math.round(accumReal) };
    });
  }, [scenario, monthlyPlan, periodFilter, filteredTransactions, selectedYear]);

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
  }, [monthlyPlan, currentCash, monthlyIncome, filteredTransactions, selectedYear]);

  return {
    handleLogout,
    sidebarOpen, setSidebarOpen,
    activeView, setActiveView,
    isEntryOpen, setIsEntryOpen,
    isUploading, fileInputRef, handleFileUpload,
    transactions, setTransactions,
    periodFilter, setPeriodFilter,
    scenario, setScenario,
    selectedYear, setSelectedYear, availableYears,
    annualBudget, setAnnualBudget: (v: number) => { setAnnualBudget(v); updateFinancialProfile({ annual_budget: v }); },
    monthlyIncome, setMonthlyIncome: (v: number) => { setMonthlyIncome(v); updateFinancialProfile({ monthly_income: v }); },
    currentCash, setCurrentCash: (v: number) => { setCurrentCash(v); updateFinancialProfile({ current_cash: v }); },
    monthlyPlan,
    projectedData,
    kpiData,
  };
};