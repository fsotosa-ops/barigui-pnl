'use client';
import { useState, useEffect } from 'react';
import { X, Loader2, FileText, Tag, ArrowRight } from 'lucide-react';
import { useExchangeRates } from '@/hooks/useExchangeRates';

// Banderas Circulares (Mismo CDN que TransactionForm)
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
}

export const QuickEntry = ({ isOpen, onClose }: QuickEntryProps) => {
  const { convertToUSD, getInverseRate, loading } = useExchangeRates();
  
  const [originalCurrency, setOriginalCurrency] = useState('BRL');
  const [originalAmount, setOriginalAmount] = useState('');
  const [amountUSD, setAmountUSD] = useState(0);
  
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    if (originalAmount && !loading) {
      const val = parseFloat(originalAmount);
      setAmountUSD(convertToUSD(val, originalCurrency));
    }
  }, [originalAmount, originalCurrency, loading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-end sm:items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Rendir Rápido</h3>
          <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors"><X size={20}/></button>
        </div>

        <form className="space-y-6">
          
          {/* --- BLOQUE DE MONEDA (DISEÑO UNIFICADO) --- */}
          <div className="bg-slate-50 p-2 rounded-[1.5rem] border border-slate-200 focus-within:ring-2 ring-slate-900 transition-all overflow-hidden">
             
             {/* Usamos el mismo Grid que en TransactionForm para alineación perfecta */}
             <div className="grid grid-cols-[auto_1fr] h-[72px] items-center">
                
                {/* Selector de Moneda Visual */}
                <div className="relative h-full flex items-center pl-3 pr-2">
                   <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-full shadow-sm border border-slate-100">
                      <img 
                          src={FLAG_URLS[originalCurrency]} 
                          alt="flag" 
                          className="w-6 h-6 rounded-full object-cover border border-slate-100"
                      />
                      <span className="text-sm font-black text-slate-700">{originalCurrency}</span>
                      <svg width="8" height="6" viewBox="0 0 10 6" fill="none" className="text-slate-400"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                   </div>

                   {/* Select Real Invisible */}
                   <select 
                     value={originalCurrency} 
                     onChange={(e) => setOriginalCurrency(e.target.value)}
                     className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                   >
                     {Object.keys(FLAG_URLS).map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                </div>

                {/* Input de Monto */}
                <input 
                  type="number" 
                  placeholder="0.00" 
                  autoFocus
                  className="w-full h-full bg-transparent pr-6 font-black text-3xl text-right text-slate-900 outline-none placeholder:text-slate-300"
                  value={originalAmount}
                  onChange={(e) => setOriginalAmount(e.target.value)}
                />
             </div>
          </div>
             
          {/* Conversión Visual (Estilo Ticket) */}
          <div className="flex flex-col items-center justify-center -mt-2">
              <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                  <span className="text-[10px] font-bold text-emerald-600 uppercase">Equivale a</span>
                  {/* Bandera USA Pequeña */}
                  <img src={FLAG_URLS['USD']} alt="us" className="w-4 h-4 rounded-full object-cover"/>
                  <span className="text-lg font-black text-emerald-700">
                    ${amountUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600">USD</span>
              </div>
              
              {/* Tasa informativa */}
              {!loading && originalCurrency !== 'USD' && (
                 <p className="text-[9px] font-medium text-slate-400 mt-2">
                   Tasa usada: 1 {originalCurrency} ≈ ${getInverseRate(originalCurrency)} USD
                 </p>
              )}
          </div>

          {/* INPUTS TEXTO */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase ml-3 mb-1 block">Descripción</label>
              <div className="relative">
                <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                    type="text" placeholder="Ej: Cena en Batel..." 
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
                  className="w-full bg-slate-50 pl-11 p-4 rounded-2xl font-bold text-slate-600 outline-none cursor-pointer appearance-none border border-transparent focus:bg-white focus:border-slate-200 transition-all"
                  value={category} onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  <optgroup label="Ingresos Operativos">
                    <option value="Sumadots - Retainer">Sumadots - Retainer</option>
                    <option value="Sumadots - Proyecto">Sumadots - Proyecto</option>
                  </optgroup>
                  <optgroup label="Costos de Venta">
                    <option value="Impuestos">Impuestos / Retención</option>
                    <option value="Comisiones">Comisiones Bancarias</option>
                  </optgroup>
                  <optgroup label="Gastos Estructurales (Chile)">
                    <option value="Deuda Bancaria">Deuda Bancaria</option>
                    <option value="Previsional">Seguros / Previsional</option>
                  </optgroup>
                  <optgroup label="Vida & Operación (Brasil)">
                    <option value="Vivienda">Vivienda (Alquiler)</option>
                    <option value="Supermercado">Supermercado</option>
                    <option value="Ocio">Ocio / Social</option>
                    <option value="Movilidad">Movilidad / Uber</option>
                    <option value="Educacion">Educación (MBA)</option>
                    <option value="Salud">Salud / Seguros</option>
                  </optgroup>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
            </div>
          </div>

          <button className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all">
            REGISTRAR
          </button>
        </form>
      </div>
    </div>
  );
};