'use client';
import { useExchangeRates } from '@/hooks/useExchangeRates';

// Mismas banderas
const FLAG_URLS: Record<string, string> = {
  BRL: 'https://flagcdn.com/w40/br.png',
  CLP: 'https://flagcdn.com/w40/cl.png',
  COP: 'https://flagcdn.com/w40/co.png',
  MXN: 'https://flagcdn.com/w40/mx.png',
  EUR: 'https://flagcdn.com/w40/eu.png',
};

export const CurrencyTicker = () => {
  const { rates, loading } = useExchangeRates();

  if (loading) {
    return (
      <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm">
        <span className="text-xs text-slate-400 font-medium animate-pulse">Sincronizando mercados...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-5 bg-white px-5 py-2 rounded-full border border-slate-200 shadow-sm whitespace-nowrap overflow-x-auto no-scrollbar max-w-[90vw] md:max-w-none">
       {Object.keys(FLAG_URLS).map((code, index) => (
         <div key={code} className="flex items-center gap-3">
            {/* Divisor (excepto el primero) */}
            {index > 0 && <div className="w-px h-4 bg-slate-200"></div>}
            
            <div className="flex items-center gap-2">
              <img src={FLAG_URLS[code]} alt={code} className="w-4 h-4 rounded-full object-cover border border-slate-100 shadow-sm"/>
              <div className="flex flex-col leading-none">
                 <span className="text-[9px] font-bold text-slate-400 uppercase">USD/{code}</span>
                 <span className="text-xs font-black text-slate-800">{rates[code]?.toFixed(code === 'CLP' || code === 'COP' ? 0 : 2)}</span>
              </div>
            </div>
         </div>
       ))}
    </div>
  );
};