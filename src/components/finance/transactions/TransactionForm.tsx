'use client';
import { useState, useEffect } from 'react';
import { X, Briefcase, User } from 'lucide-react'; 
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
    description: '',
    category: '',
    type: 'expense',
    scope: 'personal',
    originalAmount: 0,
    originalCurrency: 'CLP',
    amountUSD: 0
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

  return (
    <div className={`fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative border border-slate-100">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100"><X size={18}/></button>
        <h3 className="text-xl font-black text-slate-900 uppercase mb-8">{initialData ? 'Editar' : 'Nuevo'} Movimiento</h3>
        
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); onClose(); }} className="space-y-6">
          {/* Selector de Ámbito */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-2xl">
            <button type="button" onClick={() => setFormData({...formData, scope: 'business'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.scope === 'business' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}><Briefcase size={14}/> Negocio</button>
            <button type="button" onClick={() => setFormData({...formData, scope: 'personal'})} className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black uppercase transition-all ${formData.scope === 'personal' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><User size={14}/> Personal</button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <input type="date" required value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} className="bg-slate-50 p-4 rounded-2xl font-bold outline-none border border-transparent focus:border-slate-200" />
            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="bg-slate-50 p-4 rounded-2xl font-bold outline-none appearance-none border border-transparent focus:border-slate-200">
              <option value="expense">📉 Gasto</option>
              <option value="income">📈 Ingreso</option>
            </select>
          </div>

          <div className="bg-slate-50 p-2 rounded-[1.5rem] border border-slate-200">
             <div className="flex items-center px-4 gap-2">
                <select value={formData.originalCurrency} onChange={e => setFormData({...formData, originalCurrency: e.target.value})} className="bg-white border border-slate-100 px-3 py-1 rounded-full text-xs font-black outline-none">
                  {['CLP', 'USD', 'BRL', 'EUR'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <input type="number" step="0.01" required value={formData.originalAmount || ''} onChange={e => setFormData({...formData, originalAmount: Number(e.target.value)})} placeholder="0.00" className="flex-1 bg-transparent text-right font-black text-3xl outline-none" />
             </div>
          </div>

          <div className="space-y-4">
            <input type="text" required placeholder="Descripción..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none border border-transparent focus:border-slate-200" />
            <select required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-slate-50 p-4 rounded-2xl font-bold outline-none appearance-none border border-transparent focus:border-slate-200">
              <option value="">Seleccionar Categoría...</option>
              {CATEGORIES[formData.scope as keyof typeof CATEGORIES].map(cat => (
                <option key={cat.id} value={cat.id}>{cat.label}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg hover:bg-black transition-all shadow-xl active:scale-95">REGISTRAR</button>
        </form>
      </div>
    </div>
  );
};