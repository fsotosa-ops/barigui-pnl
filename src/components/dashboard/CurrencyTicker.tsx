'use client';
import { useExchangeRates } from '@/hooks/useExchangeRates';

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
      <div className="bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm w-full md:w-auto">
        <span className="text-xs text-slate-400 font-medium animate-pulse">Sincronizando...</span>
      </div>
    );
  }

  return (
    <div className="
      w-full md:w-auto
      bg-white border border-slate-200 shadow-sm
      /* MÓVIL: Grid de 2 columnas, bordes redondeados normales */
      grid grid-cols-2 gap-3 p-3 rounded-2xl
      /* TABLET/DESKTOP: Fila flexible, píldora redondeada */
      md:flex md:items-center md:gap-5 md:px-5 md:py-2 md:rounded-full
    ">
       {Object.keys(FLAG_URLS).map((code, index) => (
         <div key={code} className="flex items-center gap-3">
            {/* Divisor solo en desktop */}
            {index > 0 && <div className="hidden md:block w-px h-4 bg-slate-200"></div>}
            
            <div className="flex items-center gap-2">
              <img src={FLAG_URLS[code]} alt={code} className="w-5 h-5 md:w-4 md:h-4 rounded-full object-cover border border-slate-100 shadow-sm"/>
              <div className="flex flex-col leading-none">
                 <span className="text-[10px] font-bold text-slate-400 uppercase">USD/{code}</span>
                 <span className="text-xs font-black text-slate-800">{rates[code]?.toFixed(code === 'CLP' || code === 'COP' ? 0 : 2)}</span>
              </div>
            </div>
         </div>
       ))}
    </div>
  );
};