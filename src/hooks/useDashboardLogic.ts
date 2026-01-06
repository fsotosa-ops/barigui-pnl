'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Task } from '@/types/finance';
import { NotificationType } from '@/components/ui/ProcessNotification';
import { useExchangeRates } from '@/hooks/useExchangeRates';

const generateFileHash = (file: File) => {
  return `${file.name}_${file.size}_${file.lastModified}`;
};

export const useDashboardLogic = () => {
  const router = useRouter();
  const supabase = createClient();
  const { rates, convertToUSD } = useExchangeRates(); 

  // --- UI STATE ---
  const [activeView, setActiveView] = useState<'dash' | 'transactions' | 'settings' | 'roadmap'>('dash');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metricMode, setMetricMode] = useState<'annual' | 'rolling'>('rolling');
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD'); 
  
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- NOTIFICATION STATE ---
  const [notification, setNotification] = useState<{
    isOpen: boolean;
    type: NotificationType;
    title: string;
    details: string[];
  }>({ isOpen: false, type: 'success', title: '', details: [] });

  // --- DATA STATE ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // --- FILTERS ---
  const [periodFilter, setPeriodFilter] = useState<'Mensual' | 'Trimestral' | 'Anual'>('Anual');
  const [scenario, setScenario] = useState<'base' | 'worst' | 'best'>('base');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // --- PROFILE ---
  const [annualBudget, setAnnualBudget] = useState(0); 
  const [monthlyIncome, setMonthlyIncome] = useState(0); 
  const [currentCash, setCurrentCash] = useState(0);    

  const monthlyPlan = annualBudget / 12;

  // --- REFRESH DATA ---
  const refreshTransactions = async () => {
    const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
    if (txs) {
      setTransactions(txs.map(t => ({
        id: t.id, date: t.date, description: t.description, category: t.category, type: t.type,
        originalAmount: Number(t.original_amount), originalCurrency: t.original_currency,
        exchangeRate: Number(t.exchange_rate), amountUSD: Number(t.amount_usd)
      })));
    }
  };

  const loadInitialData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('*').single();
    if (profile) {
      setAnnualBudget(Number(profile.annual_budget));
      setMonthlyIncome(Number(profile.monthly_income));
      setCurrentCash(Number(profile.current_cash));
    }

    await refreshTransactions();

    const { data: tasksData } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
    if (tasksData) {
      setTasks(tasksData.map(t => ({
        id: t.id, title: t.title, completed: t.completed, blocked: t.blocked, 
        blockerDescription: t.blocker_description, impact: t.impact || 'medium', dueDate: t.due_date
      })));
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    loadInitialData();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- CRUD HANDLERS ---
  const handleAddTransaction = async (txData: Partial<Transaction>): Promise<'created' | 'duplicate' | 'error'> => {
    try {
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           description: txData.description,
           amount: txData.amountUSD, 
           originalAmount: txData.originalAmount,
           currency: txData.originalCurrency,
           category: txData.category,
           date: txData.date,
           type: txData.type
        })
      });

      const result = await response.json();
      if (result.success) {
        if (result.duplicate) return 'duplicate';
        // Solo refrescamos el estado si no estamos en medio de una subida masiva
        if (!isUploading) await refreshTransactions();
        return 'created';
      }
      return 'error';
    } catch (error) {
      return 'error';
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const parseRes = await fetch('/api/parse-statement', { method: 'POST', body: formData });
      const { transactions: parsedTxs } = await parseRes.json();

      let createdCount = 0;
      let duplicateCount = 0;

      for (const tx of parsedTxs) {
        const currency = tx.currency || 'CLP';
        const rawAmount = tx.amount || 0;
        // CONVERSIÓN REAL: Usamos la tasa del hook antes de enviar a la API
        const usdValue = convertToUSD(rawAmount, currency);

        const status = await handleAddTransaction({
           description: tx.description,
           amountUSD: usdValue, 
           originalAmount: rawAmount, 
           originalCurrency: currency, 
           category: tx.category,
           date: tx.date,
           type: tx.type
        });

        if (status === 'created') createdCount++;
        else if (status === 'duplicate') duplicateCount++;
      }
      
      // Una sola actualización de estado al final para evitar duplicados visuales
      await refreshTransactions();

      setNotification({ 
        isOpen: true, 
        type: 'success', 
        title: 'Proceso Finalizado', 
        details: [`${createdCount} registros nuevos.`, `${duplicateCount} duplicados omitidos.`] 
      });
      
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Error', details: ['No se pudo procesar el archivo.'] });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  // --- TAREAS ---
  const handleAddTask = async (taskData: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('tasks').insert([{ ...taskData, user_id: user.id }]).select().single();
    if (data) await loadInitialData();
  };

  const handleToggleTask = async (id: number, currentStatus: boolean) => {
    await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
  };

  const handleDeleteTask = async (id: number) => {
    await supabase.from('tasks').delete().eq('id', id);
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  // --- PERFIL ---
  const updateProfile = async (field: string, value: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dbField = field === 'annualBudget' ? 'annual_budget' : field === 'monthlyIncome' ? 'monthly_income' : 'current_cash';
    await supabase.from('profiles').update({ [dbField]: value }).eq('id', user.id);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login'; 
  };

  const availableYears = useMemo(() => [2025, 2026], []);
  
  const kpiData = useMemo(() => {
    const now = new Date();
    const isRolling = metricMode === 'rolling';
    let relevantTxs = [];
    let divisor = 1;

    if (isRolling) {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      relevantTxs = transactions.filter(t => new Date(t.date) >= oneYearAgo && new Date(t.date) <= now);
      divisor = 12;
    } else {
      relevantTxs = transactions.filter(t => new Date(t.date).getFullYear() === selectedYear);
      divisor = selectedYear === now.getFullYear() ? (now.getMonth() + 1) : 12;
    }

    const totalExpenseUSD = relevantTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amountUSD, 0);
    const avgMonthlyExpenseUSD = totalExpenseUSD / (divisor || 1);
    
    const varianceUSD = monthlyIncome - avgMonthlyExpenseUSD;
    const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - avgMonthlyExpenseUSD) / monthlyIncome) * 100) : 0;
    const runway = avgMonthlyExpenseUSD > 0 ? parseFloat((currentCash / avgMonthlyExpenseUSD).toFixed(1)) : 0;

    const rate = rates[displayCurrency] || 1;

    return { 
      variance: varianceUSD * rate, 
      runway, 
      savingsRate, 
      currency: displayCurrency 
    };
  }, [metricMode, displayCurrency, transactions, selectedYear, monthlyIncome, currentCash, rates]);

  return {
    sidebarOpen, setSidebarOpen, activeView, setActiveView, isEntryOpen, setIsEntryOpen, isUploading, fileInputRef,
    transactions, setTransactions, metricMode, setMetricMode, displayCurrency, setDisplayCurrency,
    tasks, handleAddTask, handleToggleTask, handleDeleteTask,
    handleAddTransaction, handleDeleteTransaction, handleFileUpload,
    periodFilter, setPeriodFilter, scenario, setScenario, selectedYear, setSelectedYear, availableYears,
    annualBudget, setAnnualBudget: (v: number) => { setAnnualBudget(v); updateProfile('annualBudget', v); },
    monthlyIncome, setMonthlyIncome: (v: number) => { setMonthlyIncome(v); updateProfile('monthlyIncome', v); },
    currentCash, setCurrentCash: (v: number) => { setCurrentCash(v); updateProfile('currentCash', v); },
    monthlyPlan, projectedData: [], kpiData, handleLogout,
    notification, closeNotification: () => setNotification(prev => ({ ...prev, isOpen: false }))
  };
};