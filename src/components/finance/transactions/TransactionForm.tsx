'use client';
import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react'; 
import { Transaction } from '@/types/finance';
import { useExchangeRates } from '@/hooks/useExchangeRates';

const FLAG_URLS: Record<string, string> = {
  USD: 'https://flagcdn.com/w80/us.png',
  BRL: 'https://flagcdn.com/w80/br.png',
  CLP: 'https://flagcdn.com/w80/cl.png',
  EUR: 'https://flagcdn.com/w80/eu.png',
  COP: 'https://flagcdn.com/w80/co.png',
  MXN: 'https://flagcdn.com/w80/mx.png',
};

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Transaction>) => void;
  initialData?: Transaction | null;
}

export const TransactionForm = ({ isOpen, onClose, onSubmit, initialData }: TransactionFormProps) => {
  const { convertToUSD, getInverseRate, loading } = useExchangeRates();

  const [formData, setFormData] = useState<Partial<Transaction>>({
    date: '', description: '', category: '', type: 'expense',
    originalAmount: 0, originalCurrency: 'BRL', amountUSD: 0
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData(initialData);
      } else {
        setFormData({ 
          date: new Date().toISOString().split('T')[0], 
          description: '', category: '', type: 'expense', 
          originalAmount: 0, originalCurrency: 'BRL', amountUSD: 0 
        });
      }
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    if (formData.originalAmount !== undefined && formData.originalCurrency && !loading) {
      const calculatedUSD = convertToUSD(formData.originalAmount, formData.originalCurrency);
      const currentRate = getInverseRate(formData.originalCurrency);
      if (calculatedUSD !== formData.amountUSD) {
         setFormData(prev => ({ ...prev, amountUSD: calculatedUSD, exchangeRate: currentRate }));
      }
    }
  }, [formData.originalAmount, formData.originalCurrency, loading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-10 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-slate-100">
        
        <button onClick={onClose} className="absolute top-8 right-8 p-2 bg-slate-50 rounded-full text-slate-400 hover:bg-slate-100 transition-colors z-10">
            <X size={18}/>
        </button>
        
        <div className="mb-8">
          <h3 className="text-xl font-black text-slate-900 tracking-tight uppercase">
            {initialData ? 'Ajustar' : 'Registrar'} Movimiento
          </h3>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-slate-50 p-2 rounded-[1.5rem] border border-slate-200 focus-within:ring-2 ring-emerald-500 transition-all overflow-hidden">
            <div className="grid grid-cols-[auto_1fr] h-[72px] items-center">
                <div className="relative h-full flex items-center pl-3 pr-2">
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm border border-slate-100">
                        <img 
                            src={FLAG_URLS[formData.originalCurrency || 'BRL']} 
                            alt="flag" 
                            className="w-6 h-6 rounded-full object-cover border border-slate-100"
                        />
                        <span className="text-sm font-black text-slate-700">{formData.originalCurrency}</span>
                        <svg width="8" height="6" viewBox="0 0 10 6" fill="none" className="text-slate-400"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                    <select 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      value={formData.originalCurrency}
                      onChange={e => setFormData({...formData, originalCurrency: e.target.value})}
                    >
                      {Object.keys(FLAG_URLS).map(curr => <option key={curr} value={curr}>{curr}</option>)}
                    </select>
                </div>

                <input 
                    type="number" placeholder="0.00" required
                    className="w-full h-full bg-transparent pr-6 font-black text-3xl text-right text-slate-900 outline-none placeholder:text-slate-200"
                    value={formData.originalAmount || ''}
                    onChange={e => setFormData({...formData, originalAmount: Number(e.target.value)})}
                />
            </div>
          </div>
            
          <div className="flex flex-col items-center justify-center -mt-2">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Equivale a</span>
                  <img src={FLAG_URLS['USD']} alt="us" className="w-4 h-4 rounded-full object-cover"/>
                  <span className="text-lg font-black text-emerald-700">
                    ${formData.amountUSD?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">USD</span>
              </div>
          </div>

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-3 mb-1 block">Fecha</label>
                <input type="date" required className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-600 outline-none focus:bg-white border border-transparent focus:border-slate-200" 
                  value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase ml-3 mb-1 block">Tipo</label>
                <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-600 outline-none appearance-none border border-transparent focus:border-slate-200" 
                  value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                  <option value="expense">📉 Gasto</option>
                  <option value="income">📈 Ingreso</option>
                </select>
              </div>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase ml-3 mb-1 block">Concepto</label>
            <input type="text" required placeholder="Descripción del flujo..." className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-800 outline-none border border-transparent focus:border-slate-200" 
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>

          <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3 mb-1 block">Unidad de Gasto / Categoría</label>
              <select className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-slate-600 outline-none appearance-none border border-transparent focus:border-slate-200" 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} required>
                <option value="">Seleccionar Categoría...</option>
                <optgroup label="💼 Operación Negocio">
                  <option value="Sumadots - Retainer">Ingreso Retainer</option>
                  <option value="Sumadots - Proyecto">Ingreso Proyecto</option>
                  <option value="Impuestos">Impuestos / Retención</option>
                  <option value="Comisiones">Comisiones Bancarias</option>
                  <option value="Software">Herramientas / SaaS</option>
                </optgroup>
                <optgroup label="🏠 Vida Personal">
                  <option value="Vivienda">Vivienda (Alquiler/Dividendos)</option>
                  <option value="Supermercado">Alimentación</option>
                  <option value="Ocio">Ocio & Social</option>
                  <option value="Movilidad">Transporte / Uber</option>
                  <option value="Educacion">Crecimiento (MBA/Cursos)</option>
                </optgroup>
              </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 p-4 rounded-2xl font-bold text-slate-400 hover:bg-slate-50 transition-colors">Cerrar</button>
            <button type="submit" disabled={loading} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black text-lg hover:bg-black shadow-xl active:scale-95 disabled:opacity-50 transition-all">
              {initialData ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};