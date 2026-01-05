'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Task } from '@/types/finance';
import { useExchangeRates } from '@/hooks/useExchangeRates';

export const useDashboardLogic = () => {
  const router = useRouter();
  const supabase = createClient();

  // --- UI STATE ---
  const [activeView, setActiveView] = useState<'dash' | 'transactions' | 'settings' | 'roadmap'>('dash');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // --- CARGA INICIAL ---
  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Perfil
      const { data: profile } = await supabase.from('profiles').select('*').single();
      if (profile) {
        setAnnualBudget(Number(profile.annual_budget));
        setMonthlyIncome(Number(profile.monthly_income));
        setCurrentCash(Number(profile.current_cash));
      } else {
        await supabase.from('profiles').insert([{ id: user.id }]);
      }

      // 2. Transacciones
      const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (txs) {
        setTransactions(txs.map(t => ({
          id: t.id, date: t.date, description: t.description, category: t.category, type: t.type,
          originalAmount: Number(t.original_amount), originalCurrency: t.original_currency,
          exchangeRate: Number(t.exchange_rate), amountUSD: Number(t.amount_usd)
        })));
      }

      // 3. Tareas
      const { data: tasksData } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
      if (tasksData) {
        setTasks(tasksData.map(t => ({
          id: t.id, title: t.title, completed: t.completed, blocked: t.blocked, 
          blockerDescription: t.blocker_description, impact: t.impact || 'medium', dueDate: t.due_date
        })));
      }
    };
    initData();
  }, []);

  // --- NUEVA FUNCIÓN: GUARDADO HÍBRIDO (SQL + VECTOR) ---
  const handleAddTransaction = async (txData: Partial<Transaction>) => {
    setIsUploading(true);
    try {
      // Usamos la API Route que crea el Embedding y guarda en DB
      const response = await fetch('/api/transactions/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           description: txData.description,
           amount: txData.amountUSD, 
           originalAmount: txData.originalAmount,
           currency: txData.originalCurrency,
           category: txData.category,
           date: txData.date || new Date().toISOString().split('T')[0],
           type: txData.type
        })
      });

      const result = await response.json();

      if (result.success) {
        // Actualizamos estado local con el dato real devuelto por la DB
        const newTx: Transaction = {
            id: result.transaction.id,
            date: result.transaction.date,
            description: result.transaction.description,
            category: result.transaction.category,
            type: result.transaction.type,
            originalAmount: Number(result.transaction.original_amount),
            originalCurrency: result.transaction.original_currency,
            exchangeRate: 0, // Se puede calcular si viene de backend
            amountUSD: Number(result.transaction.amount_usd)
        };
        
        setTransactions(prev => [newTx, ...prev]);
        setIsEntryOpen(false); // Cerramos el modal si viene de QuickEntry
      } else {
        console.error("Error al guardar transacción:", result.error);
        alert("Error al guardar. Revisa la consola.");
      }
    } catch (error) {
      console.error("Error de red:", error);
    } finally {
      setIsUploading(false);
    }
  };

  // --- OTRAS FUNCIONES ---
  const handleAddTask = async (taskData: { title: string; impact: 'high' | 'medium' | 'low'; dueDate: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const payload = { user_id: user.id, title: taskData.title, impact: taskData.impact, due_date: taskData.dueDate || null, completed: false };
    const { data, error } = await supabase.from('tasks').insert([payload]).select().single();
    if (!error && data) {
        setTasks(prev => [...prev, { id: data.id, title: data.title, completed: data.completed, blocked: data.blocked, impact: data.impact, dueDate: data.due_date }]);
    }
  };

  const handleToggleTask = async (id: number, currentStatus: boolean) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));
    await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
  };

  const handleDeleteTask = async (id: number) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from('tasks').delete().eq('id', id);
  };

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
  const handleFileUpload = async (e: any) => {};

  // --- KPIS ---
  const availableYears = useMemo(() => [2025, 2026], []);
  const filteredTransactions = useMemo(() => transactions.filter(t => new Date(t.date).getFullYear() === selectedYear), [transactions, selectedYear]);
  
  const projectedData = useMemo(() => {
    if (annualBudget === 0 && filteredTransactions.length === 0) return [];
    const monthlyExpenses = new Array(12).fill(0);
    filteredTransactions.forEach(t => {
      if (t.type === 'expense') {
        const parts = t.date.split('-');
        const month = parseInt(parts[1], 10) - 1;
        if (month >= 0 && month <= 11) monthlyExpenses[month] += t.amountUSD;
      }
    });
    const baseData = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((label, idx) => ({ label, real: monthlyExpenses[idx] }));
    let expenseMultiplier = scenario === 'worst' ? 1.20 : scenario === 'best' ? 0.90 : 1;
    let accumPlan = 0, accumReal = 0;
    const currentMonthIndex = new Date().getMonth();
    const isCurrentYear = selectedYear === new Date().getFullYear();
    
    return baseData.map((d, i) => {
      accumPlan += monthlyPlan; 
      const shouldShowReal = !isCurrentYear || i <= currentMonthIndex;
      if (shouldShowReal) accumReal += Math.round(d.real * expenseMultiplier);
      else accumReal += Math.round(monthlyPlan * expenseMultiplier);
      return { label: d.label, plan: Math.round(accumPlan), real: Math.round(accumReal) };
    });
  }, [scenario, monthlyPlan, periodFilter, filteredTransactions, selectedYear, annualBudget]);

  const kpiData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const isCurrentYear = selectedYear === new Date().getFullYear();
    let realExpense = 0;
    if (isCurrentYear) {
       realExpense = filteredTransactions.filter(t => t.type === 'expense' && new Date(t.date).getMonth() === currentMonth).reduce((acc, t) => acc + t.amountUSD, 0);
    } else {
       realExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amountUSD, 0) / 12;
    }
    const variance = Number((monthlyPlan - (realExpense || 0)).toFixed(0));
    const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - (realExpense || 0)) / monthlyIncome) * 100) : 0;
    const avgBurn = realExpense > 0 ? realExpense : monthlyPlan;
    const runwayCalc = avgBurn > 0 ? parseFloat((currentCash / avgBurn).toFixed(1)) : 0;
    return { variance, runway: runwayCalc, savingsRate };
  }, [monthlyPlan, currentCash, monthlyIncome, filteredTransactions, selectedYear]);

  return {
    sidebarOpen, setSidebarOpen, activeView, setActiveView, isEntryOpen, setIsEntryOpen, isUploading, fileInputRef,
    transactions, setTransactions,
    tasks, handleAddTask, handleToggleTask, handleDeleteTask, 
    handleAddTransaction, // <--- EXPORTADO PARA QUE LOS COMPONENTES LO USEN
    periodFilter, setPeriodFilter, scenario, setScenario, selectedYear, setSelectedYear, availableYears,
    annualBudget, setAnnualBudget: (v: number) => { setAnnualBudget(v); updateProfile('annualBudget', v); },
    monthlyIncome, setMonthlyIncome: (v: number) => { setMonthlyIncome(v); updateProfile('monthlyIncome', v); },
    currentCash, setCurrentCash: (v: number) => { setCurrentCash(v); updateProfile('currentCash', v); },
    monthlyPlan, projectedData, kpiData, handleLogout, handleFileUpload
  };
};