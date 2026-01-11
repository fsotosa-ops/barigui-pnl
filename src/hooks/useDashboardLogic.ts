'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Task, ImportBatch } from '@/types/finance';
import { NotificationType } from '@/components/ui/ProcessNotification';
import { useExchangeRates } from '@/hooks/useExchangeRates';

export const useDashboardLogic = () => {
  const supabase = createClient();
  const { convertToUSD, rates, loading: ratesLoading } = useExchangeRates(); 

  // --- UI STATE ---
  const [activeView, setActiveView] = useState<'dash' | 'transactions' | 'settings' | 'roadmap'>('dash');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Moneda seleccionada para la subida de archivo
  const [uploadCurrency, setUploadCurrency] = useState<string>('CLP');

  // --- DATA STATE ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [importBatches, setImportBatches] = useState<ImportBatch[]>([]);

  // --- FILTERS DASHBOARD ---
  const [metricMode, setMetricMode] = useState<'annual' | 'rolling'>('rolling');
  const [displayCurrency, setDisplayCurrency] = useState<string>('USD'); 
  const [periodFilter, setPeriodFilter] = useState<'Mensual' | 'Trimestral' | 'Anual'>('Anual');
  const [scenario, setScenario] = useState<'base' | 'worst' | 'best'>('base');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  
  // --- PROFILE STATE ---
  const [annualBudget, setAnnualBudget] = useState(0); 
  const [monthlyIncome, setMonthlyIncome] = useState(0); 
  const [currentCash, setCurrentCash] = useState(0); 
  const [profile, setProfile] = useState<any>(null);   

  const monthlyPlan = annualBudget / 12;

  const [notification, setNotification] = useState<{
    isOpen: boolean; type: NotificationType; title: string; details: string[];
  }>({ isOpen: false, type: 'success', title: '', details: [] });

  // --- RESPONSIVE SIDEBAR ---
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- CARGA DE DATOS ---
  const refreshTransactions = async () => {
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .is('deleted_at', null)
      .order('date', { ascending: false });
    
    if (data) {
      setTransactions(data.map(t => ({
        id: t.id, date: t.date, description: t.description, category: t.category,
        type: t.type, scope: t.scope,
        originalAmount: Number(t.original_amount), originalCurrency: t.original_currency,
        exchangeRate: Number(t.exchange_rate), amountUSD: Number(t.amount_usd),
        importBatchId: t.import_batch_id
      })));
    }
  };

  const loadBatches = async () => {
    const { data } = await supabase.from('import_batches').select('*').order('created_at', { ascending: false });
    if (data) setImportBatches(data);
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
      
      if (prof.base_currency) {
        setDisplayCurrency(prof.base_currency);
      }
    }
    
    await refreshTransactions();
    await loadBatches();
    
    const { data: tsk } = await supabase.from('tasks').select('*').order('created_at', { ascending: true });
    if (tsk) setTasks(tsk.map(t => ({ id: t.id, title: t.title, completed: t.completed, blocked: t.blocked, impact: t.impact, dueDate: t.due_date })));
  };

  useEffect(() => { loadInitialData(); }, []);

  // --- LÓGICA DE UPLOAD CON CORRECCIÓN DE ERROR ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || ratesLoading) return;

    setIsUploading(true);
    try {
      // 1. Crear el Lote en DB
      const { data: batchData, error: batchError } = await supabase
        .from('import_batches')
        .insert([{
            filename: file.name,
            currency: uploadCurrency,
            record_count: 0 
        }])
        .select()
        .single();
        
      // CORRECCIÓN AQUÍ: Separamos las validaciones para evitar el error de TypeScript
      if (batchError) {
        throw new Error("Error creando lote: " + batchError.message);
      }
      if (!batchData) {
         throw new Error("Error creando lote: No se recibieron datos del servidor.");
      }

      const batchId = batchData.id;

      // 2. Parsear Archivo
      const formData = new FormData();
      formData.append('file', file);
      
      const parseRes = await fetch('/api/parse-statement', { method: 'POST', body: formData });
      const data = await parseRes.json();

      if (!parseRes.ok) throw new Error(data.error || "Error al procesar el archivo");
      
      const parsedTxs = data.transactions;
      if (!Array.isArray(parsedTxs)) throw new Error("La IA no devolvió transacciones válidas");

      // 3. Insertar Transacciones
      let count = 0;
      for (const tx of parsedTxs) {
        const txCurrency = uploadCurrency; 
        const calculatedUSD = convertToUSD(Number(tx.amount || 0), txCurrency);
        
        await fetch('/api/transactions/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...tx,
            amount: calculatedUSD,
            originalAmount: tx.amount,
            currency: txCurrency,
            scope: tx.scope || 'personal',
            importBatchId: batchId
          })
        });
        count++;
      }

      // 4. Actualizar contador
      await supabase.from('import_batches').update({ record_count: count }).eq('id', batchId);

      await refreshTransactions();
      await loadBatches();
      setNotification({ isOpen: true, type: 'success', title: 'Importación Exitosa', details: [`Lote creado: ${file.name}`, `${count} registros procesados.`] });
    } catch (err: any) {
      console.error(err);
      setNotification({ isOpen: true, type: 'error', title: 'Error', details: [err.message] });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // --- BORRAR LOTE ---
  const handleDeleteBatch = async (batchId: string) => {
    const { error: txError } = await supabase
      .from('transactions')
      .update({ deleted_at: new Date().toISOString() })
      .eq('import_batch_id', batchId);
      
    if (!txError) {
      await supabase.from('import_batches').delete().eq('id', batchId);
      await refreshTransactions();
      await loadBatches();
      setNotification({ isOpen: true, type: 'success', title: 'Lote Eliminado', details: ['Se deshizo la carga y se borraron sus registros.'] });
    } else {
       setNotification({ isOpen: true, type: 'error', title: 'Error', details: ['No se pudo eliminar el lote.'] });
    }
  };

  const updateProfile = async (field: string, value: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const dbField = field === 'annualBudget' ? 'annual_budget' : field === 'monthlyIncome' ? 'monthly_income' : 'current_cash';
    const { error } = await supabase.from('profiles').update({ [dbField]: value }).eq('id', user.id);
    if (!error) setProfile((prev: any) => prev ? { ...prev, [dbField]: value } : null);
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase.from('transactions').update({ deleted_at: new Date().toISOString() }).in('id', selectedIds);
    if (!error) {
      setTransactions(prev => prev.filter(t => !selectedIds.includes(t.id)));
      setSelectedIds([]);
      setNotification({ isOpen: true, type: 'success', title: 'Archivado', details: [`${selectedIds.length} registros movidos a papelera.`] });
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const { error } = await supabase.from('transactions').update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (!error) setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const handleAddTransaction = async (txData: Partial<Transaction>) => { 
    const usdVal = txData.amountUSD || (txData.originalAmount && txData.originalCurrency ? convertToUSD(txData.originalAmount, txData.originalCurrency) : 0);
    await fetch('/api/transactions/create', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...txData, amount: usdVal })
    });
    await refreshTransactions();
    return 'created'; 
  };

  const handleUpdateTransaction = async (txData: Partial<Transaction>) => {
     const usdVal = txData.amountUSD || (txData.originalAmount && txData.originalCurrency ? convertToUSD(txData.originalAmount, txData.originalCurrency) : 0);
     await fetch('/api/transactions/update', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...txData, amount: usdVal })
     });
     await refreshTransactions();
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
    
    if (profile?.base_currency && profile.base_currency !== 'USD') {
        incomeUSD = convertToUSD(monthlyIncome, profile.base_currency);
        cashUSD = convertToUSD(currentCash, profile.base_currency);
    }

    const varianceUSD = incomeUSD - avgExpense;
    const savingsRate = incomeUSD > 0 ? Math.round(((incomeUSD - avgExpense) / incomeUSD) * 100) : 0;
    const runway = avgExpense > 0 ? parseFloat((cashUSD / avgExpense).toFixed(1)) : 0;

    let displayVariance = varianceUSD;
    if (displayCurrency !== 'USD' && rates[displayCurrency]) {
       displayVariance = varianceUSD * rates[displayCurrency];
    }
    
    return { variance: displayVariance, runway, savingsRate, currency: displayCurrency };
  }, [metricMode, transactions, selectedYear, monthlyIncome, currentCash, profile, displayCurrency, rates, convertToUSD]);

  return {
    sidebarOpen, setSidebarOpen, activeView, setActiveView, isEntryOpen, setIsEntryOpen, isUploading, fileInputRef,
    transactions, setTransactions, selectedIds, setSelectedIds, importBatches,
    handleDeleteTransaction, handleBulkDelete, handleAddTransaction, handleUpdateTransaction, handleFileUpload, handleDeleteBatch,
    uploadCurrency, setUploadCurrency,
    metricMode, setMetricMode, displayCurrency, setDisplayCurrency,
    tasks, handleAddTask: () => {}, handleToggleTask: () => {}, handleDeleteTask: () => {},
    periodFilter, setPeriodFilter, scenario, setScenario, selectedYear, setSelectedYear, availableYears: [2025, 2026],
    annualBudget, setAnnualBudget: (v: number) => { setAnnualBudget(v); updateProfile('annualBudget', v); },
    monthlyIncome, setMonthlyIncome: (v: number) => { setMonthlyIncome(v); updateProfile('monthlyIncome', v); },
    currentCash, setCurrentCash: (v: number) => { setCurrentCash(v); updateProfile('currentCash', v); },
    monthlyPlan, projectedData: [], kpiData, handleLogout: () => {}, profile, loadInitialData,
    notification, closeNotification: () => setNotification(prev => ({ ...prev, isOpen: false })),
    updateProfile
  };
};