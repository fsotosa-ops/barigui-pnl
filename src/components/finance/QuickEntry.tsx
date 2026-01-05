'use client';
import { useState, useEffect } from 'react';
import { X, FileText, Tag } from 'lucide-react';
import { useExchangeRates } from '@/hooks/useExchangeRates';

// Banderas
const FLAG_URLS: Record<string, string> = {
  USD: 'https://flagcdn.com/w80/us.png',
  BRL: 'https://flagcdn.com/w80/br.png',
  CLP: 'https://flagcdn.com/w80/cl.png',
  EUR: 'https://flagcdn.com/w80/eu.png',
  COP: 'https://flagcdn.com/w80/co.png',
  MXN: 'https://flagcdn.com/w80/mx.png',
};

interface QuickEntryProps {
  isOpen: boolean;
  onClose: () => void;
  // Agregamos la prop para conectar con la lógica
  onAdd?: (transactionData: any) => Promise<void>; 
}

export const QuickEntry = ({ isOpen, onClose, onAdd }: QuickEntryProps) => {
  const { convertToUSD, getInverseRate, loading } = useExchangeRates();
  
  const [originalCurrency, setOriginalCurrency] = useState('BRL');
  const [originalAmount, setOriginalAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState(0);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (originalAmount && !loading) {
      const val = parseFloat(originalAmount);
      setAmountUSD(convertToUSD(val, originalCurrency));
    }
  }, [originalAmount, originalCurrency, loading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onAdd) return;

    setIsSubmitting(true);
    await onAdd({
        description,
        category,
        originalCurrency,
        originalAmount: parseFloat(originalAmount),
        amountUSD,
        type: 'expense', // Por defecto es gasto en quick entry
        date: new Date().toISOString().split('T')[0]
    });
    
    // Limpiar form
    setDescription('');
    setOriginalAmount('');
    setCategory('');
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Rendir Rápido</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"><X size={20}/></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="bg-slate-50 p-2 rounded-[1.5rem] border border-slate-200 focus-within:ring-2 ring-slate-900 transition-all overflow-hidden">
             <div className="grid grid-cols-[auto_1fr] h-[72px] items-center">
                <div className="relative h-full flex items-center pl-3 pr-2">
                   <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm border border-slate-100">
                      <img src={FLAG_URLS[originalCurrency]} alt="flag" className="w-6 h-6 rounded-full object-cover border border-slate-100"/>
                      <span className="text-sm font-black text-slate-700">{originalCurrency}</span>
                   </div>
                   <select 
                     value={originalCurrency} 
                     onChange={(e) => setOriginalCurrency(e.target.value)}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   >
                     {Object.keys(FLAG_URLS).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>
                <input 
                  type="number" placeholder="0.00" autoFocus required
                  className="w-full h-full bg-transparent pr-6 font-black text-3xl text-right text-slate-900 outline-none placeholder:text-slate-300"
                  value={originalAmount} onChange={(e) => setOriginalAmount(e.target.value)}
                />
             </div>
          </div>
             
          <div className="flex flex-col items-center justify-center -mt-2">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Equivale a</span>
                  <img src={FLAG_URLS['USD']} alt="us" className="w-4 h-4 rounded-full object-cover"/>
                  <span className="text-lg font-black text-emerald-700">
                    ${amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">USD</span>
              </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3 mb-1 block">Descripción</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                    type="text" placeholder="Ej: Cena en Batel..." required
                    className="w-full bg-slate-50 pl-11 p-4 rounded-2xl font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 ring-slate-100 transition-all border border-transparent focus:border-slate-200"
                    value={description} onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3 mb-1 block">Categoría</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <select 
                  required
                  className="w-full bg-slate-50 pl-11 p-4 rounded-2xl font-bold text-slate-600 outline-none cursor-pointer appearance-none border border-transparent focus:bg-white focus:border-slate-200 transition-all"
                  value={category} onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
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
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting || loading}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 disabled:scale-100"
          >
            {isSubmitting ? 'GUARDANDO INTELIGENTEMENTE...' : 'REGISTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
};