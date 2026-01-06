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
  const { rates } = useExchangeRates(); // Acceso a tasas de cambio

  // --- UI STATE ---
  const [activeView, setActiveView] = useState<'dash' | 'transactions' | 'settings' | 'roadmap'>('dash');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [metricMode, setMetricMode] = useState<'annual' | 'rolling'>('rolling');
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD'); // Estado para el selector de moneda
  
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

  // --- CARGA INICIAL Y RESPONSIVIDAD ---
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);

    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase.from('profiles').select('*').single();
      if (profile) {
        setAnnualBudget(Number(profile.annual_budget));
        setMonthlyIncome(Number(profile.monthly_income));
        setCurrentCash(Number(profile.current_cash));
      } else {
        await supabase.from('profiles').insert([{ id: user.id }]);
      }

      const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (txs) {
        setTransactions(txs.map(t => ({
          id: t.id, date: t.date, description: t.description, category: t.category, type: t.type,
          originalAmount: Number(t.original_amount), originalCurrency: t.original_currency,
          exchangeRate: Number(t.exchange_rate), amountUSD: Number(t.amount_usd)
        })));
      }

      const { data: tasksData } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
      if (tasksData) {
        setTasks(tasksData.map(t => ({
          id: t.id, title: t.title, completed: t.completed, blocked: t.blocked, 
          blockerDescription: t.blocker_description, impact: t.impact || 'medium', dueDate: t.due_date
        })));
      }
    };
    initData();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- GUARDADO INTELIGENTE ---
  const handleAddTransaction = async (txData: Partial<Transaction>): Promise<'created' | 'duplicate' | 'error'> => {
    const isSingleEntry = !isUploading; 
    if (isSingleEntry) setIsUploading(true);

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
           date: txData.date || new Date().toISOString().split('T')[0],
           type: txData.type
        })
      });

      const result = await response.json();

      if (result.success) {
        if (result.duplicate) return 'duplicate';

        const newTx: Transaction = {
            id: result.transaction.id,
            date: result.transaction.date,
            description: result.transaction.description,
            category: result.transaction.category,
            type: result.transaction.type,
            originalAmount: Number(result.transaction.original_amount),
            originalCurrency: result.transaction.original_currency,
            exchangeRate: Number(result.transaction.exchange_rate),
            amountUSD: Number(result.transaction.amount_usd)
        };
        
        setTransactions(prev => [newTx, ...prev]);
        
        if (isSingleEntry) {
            setIsEntryOpen(false);
            setNotification({
                isOpen: true, type: 'success', title: 'Movimiento Registrado', 
                details: ['La transacción se guardó y procesó correctamente.']
            });
        }
        return 'created';
      } else {
        if (isSingleEntry) setNotification({ isOpen: true, type: 'error', title: 'Error', details: ['No se pudo guardar la transacción.'] });
        return 'error';
      }
    } catch (error) {
      return 'error';
    } finally {
      if (isSingleEntry) setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileHash = generateFileHash(file);
    const { data: existingLog } = await supabase.from('import_logs').select('id').eq('file_hash', fileHash).maybeSingle();

    if (existingLog) {
       const confirmReupload = confirm("Este archivo ya fue importado. ¿Procesar de nuevo?");
       if (!confirmReupload) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
       }
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const parseRes = await fetch('/api/parse-statement', { method: 'POST', body: formData });
      if (!parseRes.ok) throw new Error('Error analizando archivo');
      const { transactions: parsedTxs } = await parseRes.json();

      let createdCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;

      for (const tx of parsedTxs) {
        const status = await handleAddTransaction({
           description: tx.description,
           amountUSD: tx.amount || 0, 
           originalAmount: tx.original_amount || tx.amount || 0, 
           originalCurrency: tx.currency || 'CLP', 
           category: tx.category,
           date: tx.date,
           type: tx.type
        });
        if (status === 'created') createdCount++;
        else if (status === 'duplicate') duplicateCount++;
        else errorCount++;
      }
      
      if (createdCount > 0 || duplicateCount > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) await supabase.from('import_logs').insert({ user_id: user.id, file_hash: fileHash, file_name: file.name });
      }

      const details = [];
      let type: NotificationType = 'success';
      if (createdCount > 0) details.push(`✅ ${createdCount} nuevos registros.`);
      if (duplicateCount > 0) details.push(`⚠️ ${duplicateCount} ignorados (duplicados).`);
      if (errorCount > 0) { details.push(`❌ ${errorCount} errores.`); if (createdCount === 0) type = 'error'; }

      setNotification({ isOpen: true, type, title: 'Proceso Completado', details });
      
    } catch (error) {
      setNotification({ isOpen: true, type: 'error', title: 'Error de Lectura', details: ['No se pudo procesar el archivo.'] });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; 
    }
  };

  const closeNotification = () => setNotification(prev => ({ ...prev, isOpen: false }));

  // --- TAREAS HANDLERS ---
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

  const handleBlockTask = async (id: number, isBlocked: boolean, reason?: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, blocked: isBlocked, blockerDescription: reason } : t));
    await supabase.from('tasks').update({ blocked: isBlocked, blocker_description: isBlocked ? reason : null }).eq('id', id);
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

  // --- KPIS CON CONVERSIÓN DINÁMICA ---
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
      const isCurrentYear = selectedYear === now.getFullYear();
      divisor = isCurrentYear ? (now.getMonth() + 1) : 12;
    }

    // Cálculos en USD Base
    const totalExpenseUSD = relevantTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amountUSD, 0);
    const avgMonthlyExpenseUSD = totalExpenseUSD / (divisor || 1);
    
    const varianceUSD = monthlyIncome - avgMonthlyExpenseUSD;
    const savingsRate = monthlyIncome > 0 ? Math.round(((monthlyIncome - avgMonthlyExpenseUSD) / monthlyIncome) * 100) : 0;
    const runway = avgMonthlyExpenseUSD > 0 ? parseFloat((currentCash / avgMonthlyExpenseUSD).toFixed(1)) : 0;

    // Conversión a Moneda de Visualización
    const rate = rates[displayCurrency] || 1;
    const convert = (val: number) => val * rate;

    return { 
      variance: convert(varianceUSD), // Se devuelve convertido
      runway, // Meses no cambian por moneda
      savingsRate, // Porcentaje no cambia por moneda
      currency: displayCurrency 
    };
  }, [metricMode, displayCurrency, transactions, selectedYear, monthlyIncome, currentCash, rates]);
  
  const projectedData = useMemo(() => {
    if (annualBudget === 0 && transactions.length === 0) return [];
    const monthlyExpenses = new Array(12).fill(0);
    transactions.filter(t => new Date(t.date).getFullYear() === selectedYear).forEach(t => {
      if (t.type === 'expense') {
        const month = new Date(t.date).getMonth();
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
  }, [scenario, monthlyPlan, transactions, selectedYear, annualBudget]);

  return {
    sidebarOpen, setSidebarOpen, activeView, setActiveView, isEntryOpen, setIsEntryOpen, isUploading, fileInputRef,
    transactions, setTransactions,
    metricMode, setMetricMode,
    displayCurrency, setDisplayCurrency, // Exportamos controles de moneda
    tasks, handleAddTask, handleToggleTask, handleDeleteTask, handleBlockTask,
    handleAddTransaction,
    handleFileUpload,
    periodFilter, setPeriodFilter, scenario, setScenario, selectedYear, setSelectedYear, availableYears,
    annualBudget, setAnnualBudget: (v: number) => { setAnnualBudget(v); updateProfile('annualBudget', v); },
    monthlyIncome, setMonthlyIncome: (v: number) => { setMonthlyIncome(v); updateProfile('monthlyIncome', v); },
    currentCash, setCurrentCash: (v: number) => { setCurrentCash(v); updateProfile('currentCash', v); },
    monthlyPlan, projectedData, kpiData, handleLogout,
    notification, closeNotification 
  };
};