'use client';
import { useState, useEffect } from 'react';
import { X, Briefcase, User, CheckCircle2 } from 'lucide-react'; 
import { Transaction } from '@/types/finance';
import { useExchangeRates } from '@/hooks/useExchangeRates';
import { CATEGORIES } from '@/lib/constants/finance';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Transaction>) => void;
  initialData?: Transaction | null;
}

export const TransactionForm = ({ isOpen, onClose, onSubmit, initialData }: TransactionFormProps) => {
  const { convertToUSD, loading } = useExchangeRates();
  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    description: '', category: '', type: 'expense', scope: 'personal',
    originalAmount: 0, originalCurrency: 'CLP', amountUSD: 0
  });

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {
        date: new Date().toISOString().split('T')[0],
        description: '', category: '', type: 'expense', scope: 'personal',
        originalAmount: 0, originalCurrency: 'CLP', amountUSD: 0
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (formData.originalAmount && formData.originalCurrency && !loading) {
      const calculated = convertToUSD(formData.originalAmount, formData.originalCurrency);
      setFormData(prev => ({ ...prev, amountUSD: calculated }));
    }
  }, [formData.originalAmount, formData.originalCurrency, loading]);

  if (!isOpen) return null;

  return (
    // Z-INDEX 100 para asegurar que esté sobre Sidebar (z-50) y botones flotantes (z-40)
    <div className="fixed inset-0 z-[100]">
      {/* Backdrop oscuro */}
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Contenedor de Scroll */}
      <div className="absolute inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          
          {/* Tarjeta del Modal */}
          <div className="relative transform overflow-hidden rounded-[2rem] bg-white text-left shadow-2xl transition-all sm:my-8 w-full max-w-lg border border-slate-100 animate-in zoom-in-95 duration-200">
            
            {/* Header con Botón Cerrar */}
            <div className="flex justify-between items-center px-8 pt-8 pb-4">
               <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {initialData ? 'Editar' : 'Nuevo'} Movimiento
               </h3>
               <button 
                  onClick={onClose} 
                  className="p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
               >
                  <X size={20}/>
               </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); onClose(); }} className="px-8 pb-10 space-y-6">
              
              {/* Selector de Ámbito */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button type="button" onClick={() => setFormData({...formData, scope: 'business'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.scope === 'business' ? 'bg-white text-emerald-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}>
                   <Briefcase size={16}/> Negocio
                </button>
                <button type="button" onClick={() => setFormData({...formData, scope: 'personal'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.scope === 'personal' ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' : 'text-slate-400 hover:text-slate-600'}`}>
                   <User size={16}/> Personal
                </button>
              </div>

              {/* Fila Fecha y Tipo */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Fecha</label>
                   <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm text-slate-700 outline-none border border-transparent focus:border-slate-300 focus:bg-white transition-all" />
                </div>
                <div className="space-y-1.5">
                   <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Tipo</label>
                   <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm text-slate-700 outline-none appearance-none border border-transparent focus:border-slate-300 focus:bg-white transition-all cursor-pointer">
                    <option value="expense">📉 Gasto</option>
                    <option value="income">📈 Ingreso</option>
                   </select>
                </div>
              </div>

              {/* Input de Monto */}
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Monto Real</label>
                 <div className="bg-slate-50 p-3 rounded-[1.5rem] border border-transparent focus-within:border-slate-300 focus-within:bg-white transition-all flex items-center gap-3">
                    <select value={formData.originalCurrency} onChange={e => setFormData({...formData, originalCurrency: e.target.value})} className="bg-white border border-slate-200 px-3 py-2 rounded-xl text-xs font-black outline-none cursor-pointer hover:border-slate-300 transition-colors">
                      {['CLP', 'USD', 'BRL', 'EUR', 'COP', 'MXN'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <input 
                      type="number" 
                      step="0.01" 
                      required 
                      value={formData.originalAmount || ''} 
                      onChange={e => setFormData({...formData, originalAmount: Number(e.target.value)})} 
                      placeholder="0" 
                      className="flex-1 bg-transparent text-right font-black text-3xl text-slate-800 outline-none placeholder:text-slate-300 w-full min-w-0" 
                    />
                 </div>
              </div>

              {/* Descripción y Categoría */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Detalle</label>
                  <input type="text" required placeholder="Ej: Pago Hosting..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm text-slate-700 outline-none border border-transparent focus:border-slate-300 focus:bg-white transition-all" />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase ml-2">Categoría</label>
                  <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm text-slate-700 outline-none appearance-none border border-transparent focus:border-slate-300 focus:bg-white transition-all cursor-pointer">
                    <option value="">Seleccionar...</option>
                    {CATEGORIES[formData.scope as keyof typeof CATEGORIES]?.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Footer Acciones */}
              <div className="pt-4">
                 <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-black transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2">
                    <CheckCircle2 size={18} />
                    {initialData ? 'GUARDAR CAMBIOS' : 'REGISTRAR'}
                 </button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};