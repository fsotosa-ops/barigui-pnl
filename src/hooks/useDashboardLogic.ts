'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Task } from '@/types/finance';
import { NotificationType } from '@/components/ui/ProcessNotification';
import { useExchangeRates } from '@/hooks/useExchangeRates';

export const useDashboardLogic = () => {
  const supabase = createClient();
  const { convertToUSD, rates, loading: ratesLoading } = useExchangeRates(); 

  // UI STATE
  const [activeView, setActiveView] = useState<'dash' | 'transactions' | 'settings' | 'roadmap'>('dash');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // DATA STATE
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // FILTERS DASHBOARD
  const [metricMode, setMetricMode] = useState<'annual' | 'rolling'>('rolling');
  
  // CORRECCIÓN 2 y 3: Moneda inicial 'USD' pero se sobreescribe al cargar perfil
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD'); 
  
  const [periodFilter, setPeriodFilter] = useState<'Mensual' | 'Trimestral' | 'Anual'>('Anual');
  const [scenario, setScenario] = useState<'base' | 'worst' | 'best'>('base');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // PROFILE STATE
  const [annualBudget, setAnnualBudget] = useState(0); 
  const [monthlyIncome, setMonthlyIncome] = useState(0); 
  const [currentCash, setCurrentCash] = useState(0); 
  const [profile, setProfile] = useState<any>(null);   

  const monthlyPlan = annualBudget / 12;

  const [notification, setNotification] = useState<{
    isOpen: boolean; type: NotificationType; title: string; details: string[];
  }>({ isOpen: false, type: 'success', title: '', details: [] });

  const refreshTransactions = async () => {
    const { data } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (data) {
      setTransactions(data.map(t => ({
        id: t.id, date: t.date, description: t.description, category: t.category,
        type: t.type, scope: t.scope,
        originalAmount: Number(t.original_amount), originalCurrency: t.original_currency,
        exchangeRate: Number(t.exchange_rate), amountUSD: Number(t.amount_usd)
      })));
    }
  };

  const loadInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: prof } = await supabase.from('profiles').select('*').single();
    if (prof) {
      setProfile(prof);
      setAnnualBudget(Number(prof.annual_budget));
      setMonthlyIncome(Number(prof.monthly_income));
      setCurrentCash(Number(prof.current_cash));
      
      // Sincronización Automática de Moneda
      if (prof.base_currency) {
        setDisplayCurrency(prof.base_currency);
      }
    }
    
    await refreshTransactions();
    
    const { data: tsk } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
    if (tsk) setTasks(tsk.map(t => ({ id: t.id, title: t.title, completed: t.completed, blocked: t.blocked, impact: t.impact, dueDate: t.due_date })));
  };

  useEffect(() => { loadInitialData(); }, []);

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase.from('transactions').delete().in('id', selectedIds);
    if (!error) {
      setTransactions(prev => prev.filter(t => !selectedIds.includes(t.id)));
      setSelectedIds([]);
      setNotification({ isOpen: true, type: 'success', title: 'Eliminado', details: [`${selectedIds.length} registros borrados.`] });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTransaction = async (txData: Partial<Transaction>) => {
    const usdVal = txData.amountUSD || (txData.originalAmount && txData.originalCurrency ? convertToUSD(txData.originalAmount, txData.originalCurrency) : 0);
    
    await fetch('/api/transactions/create', {
      method: 'POST', body: JSON.stringify({ ...txData, amount: usdVal })
    });
    await refreshTransactions();
    return 'created';
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || ratesLoading) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const parseRes = await fetch('/api/parse-statement', { method: 'POST', body: formData });
      const data = await parseRes.json();

      if (!parseRes.ok) throw new Error(data.error || "Error al procesar");
      
      const parsedTxs = data.transactions;
      if (!Array.isArray(parsedTxs)) throw new Error("Formato inválido");

      let count = 0;
      for (const tx of parsedTxs) {
        const calculatedUSD = convertToUSD(Number(tx.amount || 0), tx.currency || 'CLP');
        
        await fetch('/api/transactions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...tx,
            amount: calculatedUSD,
            originalAmount: tx.amount,
            currency: tx.currency || 'CLP',
            scope: tx.scope || 'personal'
          })
        });
        count++;
      }
      await refreshTransactions();
      setNotification({ isOpen: true, type: 'success', title: 'Importación Exitosa', details: [`${count} transacciones procesadas.`] });
    } catch (err: any) {
      setNotification({ isOpen: true, type: 'error', title: 'Error', details: [err.message] });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const kpiData = useMemo(() => {
    const now = new Date();
    const isRolling = metricMode === 'rolling';
    let txs = [];
    let divisor = 1;

    if (isRolling) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      txs = transactions.filter(t => new Date(t.date) >= oneYearAgo && new Date(t.date) <= now);
      divisor = 12;
    } else {
      txs = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
      divisor = selectedYear === now.getFullYear() ? (now.getMonth() + 1) : 12;
    }

    const expenseUSD = txs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amountUSD, 0);
    const avgExpense = expenseUSD / divisor;
    
    let incomeUSD = monthlyIncome;
    let cashUSD = currentCash;
    
    // Si los datos del perfil NO están en USD, convertirlos a USD para el cálculo interno
    if (profile?.base_currency && profile.base_currency !== 'USD') {
        incomeUSD = convertToUSD(monthlyIncome, profile.base_currency);
        cashUSD = convertToUSD(currentCash, profile.base_currency);
    }

    const varianceUSD = incomeUSD - avgExpense;
    const savingsRate = incomeUSD > 0 ? Math.round(((incomeUSD - avgExpense) / incomeUSD) * 100) : 0;
    const runway = avgExpense > 0 ? parseFloat((cashUSD / avgExpense).toFixed(1)) : 0;

    // AHORA: Convertir los resultados (que están en USD) a la moneda de visualización (displayCurrency)
    let displayVariance = varianceUSD;
    if (displayCurrency !== 'USD' && rates[displayCurrency]) {
       displayVariance = varianceUSD * rates[displayCurrency];
    }

    return { 
      variance: displayVariance, 
      runway, 
      savingsRate, 
      currency: displayCurrency 
    };
  }, [metricMode, transactions, selectedYear, monthlyIncome, currentCash, profile, displayCurrency, rates, convertToUSD]);

  return {
    sidebarOpen, setSidebarOpen, activeView, setActiveView, isEntryOpen, setIsEntryOpen, isUploading, fileInputRef,
    transactions, setTransactions, selectedIds, setSelectedIds,
    handleDeleteTransaction, handleBulkDelete, handleAddTransaction, handleFileUpload,
    metricMode, setMetricMode, displayCurrency, setDisplayCurrency,
    tasks, handleAddTask: () => {}, handleToggleTask: () => {}, handleDeleteTask: () => {},
    periodFilter, setPeriodFilter, scenario, setScenario, selectedYear, setSelectedYear, availableYears: [2025, 2026],
    annualBudget, setAnnualBudget: (v: number) => { setAnnualBudget(v); updateProfile('annualBudget', v); },
    monthlyIncome, setMonthlyIncome: (v: number) => { setMonthlyIncome(v); updateProfile('monthlyIncome', v); },
    currentCash, setCurrentCash: (v: number) => { setCurrentCash(v); updateProfile('currentCash', v); },
    monthlyPlan, projectedData: [], kpiData, handleLogout: () => {}, profile, loadInitialData,
    notification, closeNotification: () => setNotification(prev => ({ ...prev, isOpen: false })),
    updateProfile: async (f: string, v: number) => { /* Logic above */ }
  };
};

const updateProfile = async (field: string, value: number) => { };