'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Transaction, Task } from '@/types/finance';
import { NotificationType } from '@/components/ui/ProcessNotification';

// --- HELPER PARA HUELLA DIGITAL (Identificador único de archivo) ---
const generateFileHash = (file: File) => {
  // Creamos una firma única combinando: Nombre + Tamaño + Última Modificación
  return `${file.name}_${file.size}_${file.lastModified}`;
};

export const useDashboardLogic = () => {
  const router = useRouter();
  const supabase = createClient();

  // --- UI STATE ---
  const [activeView, setActiveView] = useState<'dash' | 'transactions' | 'settings' | 'roadmap'>('dash');
  
  // MODIFICACIÓN RESPONSIVE: Iniciar cerrado por defecto para evitar parpadeos en móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
    // 1. Lógica Responsive: Abrir sidebar solo en escritorio
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    // Ejecutar al montar
    handleResize();
    
    // Escuchar cambios de tamaño
    window.addEventListener('resize', handleResize);

    // 2. Carga de Datos
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Perfil
      const { data: profile } = await supabase.from('profiles').select('*').single();
      if (profile) {
        setAnnualBudget(Number(profile.annual_budget));
        setMonthlyIncome(Number(profile.monthly_income));
        setCurrentCash(Number(profile.current_cash));
      } else {
        await supabase.from('profiles').insert([{ id: user.id }]);
      }

      // Transacciones
      const { data: txs } = await supabase.from('transactions').select('*').order('date', { ascending: false });
      if (txs) {
        setTransactions(txs.map(t => ({
          id: t.id, date: t.date, description: t.description, category: t.category, type: t.type,
          originalAmount: Number(t.original_amount), originalCurrency: t.original_currency,
          exchangeRate: Number(t.exchange_rate), amountUSD: Number(t.amount_usd)
        })));
      }

      // Tareas
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

  // --- 1. GUARDADO INTELIGENTE (API HÍBRIDA) ---
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
        if (result.duplicate) {
            return 'duplicate';
        }

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
                isOpen: true, 
                type: 'success', 
                title: 'Movimiento Registrado', 
                details: ['La transacción se guardó y procesó correctamente.']
            });
        }
        return 'created';
      } else {
        console.error("Error al guardar transacción:", result.error);
        if (isSingleEntry) {
             setNotification({ isOpen: true, type: 'error', title: 'Error', details: ['No se pudo guardar la transacción.'] });
        }
        return 'error';
      }
    } catch (error) {
      console.error("Error de red:", error);
      return 'error';
    } finally {
      if (isSingleEntry) setIsUploading(false);
    }
  };

  // --- 2. UPLOAD OPTIMIZADO (CHECK EN BASE DE DATOS) ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // A. Generar huella digital del archivo
    const fileHash = generateFileHash(file);

    // B. Consultar historial en Supabase (Costo $0, muy rápido)
    const { data: existingLog } = await supabase
      .from('import_logs')
      .select('id')
      .eq('file_hash', fileHash)
      .maybeSingle();

    // C. Si ya existe, pedir confirmación crítica
    if (existingLog) {
       const confirmReupload = confirm(
          "💾 ARCHIVO YA PROCESADO EN LA NUBE.\n\n" +
          "Nuestra base de datos indica que este archivo ya fue importado.\n" +
          "¿Realmente quieres volver a gastar créditos de IA en él?"
       );
       
       if (!confirmReupload) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return; // Cancelamos operación -> Ahorro de Tokens ✅
       }
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      // D. Análisis con IA (Costo de Tokens)
      const parseRes = await fetch('/api/parse-statement', {
        method: 'POST',
        body: formData,
      });
      
      if (!parseRes.ok) throw new Error('Error analizando archivo');
      const { transactions: parsedTxs } = await parseRes.json();

      let createdCount = 0;
      let duplicateCount = 0;
      let errorCount = 0;

      // E. Procesamiento Secuencial
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
      
      // F. Registrar en Bitácora (Si hubo éxito real)
      if (createdCount > 0 || duplicateCount > 0) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase.from('import_logs').insert({
                user_id: user.id,
                file_hash: fileHash,
                file_name: file.name
            });
          }
      }

      // G. Notificación Final
      const details = [];
      let type: NotificationType = 'success';
      let title = 'Proceso Completado';

      if (createdCount > 0) details.push(`✅ ${createdCount} nuevos registros guardados.`);
      if (duplicateCount > 0) {
          details.push(`⚠️ ${duplicateCount} transacciones ya existían (ignoradas).`);
          if (createdCount === 0) { type = 'warning'; title = 'Sin Novedades'; }
      }
      if (errorCount > 0) {
          details.push(`❌ ${errorCount} errores.`);
          if (createdCount === 0) type = 'error';
      }

      setNotification({ isOpen: true, type, title, details });
      
    } catch (error) {
      console.error("Upload error:", error);
      setNotification({ 
          isOpen: true, 
          type: 'error', 
          title: 'Error de Lectura', 
          details: ['No se pudo procesar el archivo. Verifica el formato.'] 
      });
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

  // --- PERFIL HANDLERS ---
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

  // --- KPIS & PROJECCIONES ---
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