'use client';
import { useState, useEffect } from 'react';
import { Globe, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useExchangeRates } from '@/hooks/useExchangeRates';

interface CurrencySettingsProps {
  onUpdate?: () => void;
}

const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: 'Dólar Americano', symbol: '$', flag: 'https://flagcdn.com/w40/us.png' },
  { code: 'CLP', name: 'Peso Chileno', symbol: '$', flag: 'https://flagcdn.com/w40/cl.png' },
  { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', flag: 'https://flagcdn.com/w40/br.png' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: 'https://flagcdn.com/w40/eu.png' },
  { code: 'COP', name: 'Peso Colombiano', symbol: '$', flag: 'https://flagcdn.com/w40/co.png' },
  { code: 'MXN', name: 'Peso Mexicano', symbol: '$', flag: 'https://flagcdn.com/w40/mx.png' },
];

export const CurrencySettings = ({ onUpdate }: CurrencySettingsProps) => {
  const supabase = createClient();
  const { rates, convertToUSD } = useExchangeRates();
  
  const [baseCurrency, setBaseCurrency] = useState('CLP');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [conversionPreview, setConversionPreview] = useState<any>(null);

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('base_currency').single();
    if (profile?.base_currency) setBaseCurrency(profile.base_currency);
  };

  const calculateConversionPreview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('*').single();
    if (!profile) return;

    const currentRate = rates[baseCurrency] || 1;
    const toUSD = (amount: number) => {
      if (profile.base_currency === 'USD') return amount;
      return convertToUSD(amount, profile.base_currency || 'CLP');
    };
    const fromUSD = (amount: number) => {
      if (baseCurrency === 'USD') return amount;
      return amount * currentRate;
    };

    setConversionPreview({
      current: { cash: profile.current_cash, budget: profile.annual_budget, income: profile.monthly_income, currency: profile.base_currency || 'CLP' },
      new: { cash: fromUSD(toUSD(profile.current_cash)), budget: fromUSD(toUSD(profile.annual_budget)), income: fromUSD(toUSD(profile.monthly_income)), currency: baseCurrency }
    });
    setShowConfirm(true);
  };

  const handleCurrencyChange = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('profiles').update({ 
        base_currency: baseCurrency,
        current_cash: conversionPreview.new.cash,
        annual_budget: conversionPreview.new.budget,
        monthly_income: conversionPreview.new.income
      }).eq('id', user.id);
      if (error) throw error;
      setShowConfirm(false);
      onUpdate?.();
    } catch (error) {
      alert('Error al actualizar moneda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Globe size={32} /></div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Moneda Base</h3>
          <p className="text-sm text-slate-500 mt-1">Define la moneda de tu operación diaria</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {SUPPORTED_CURRENCIES.map((currency) => (
          <button
            key={currency.code}
            onClick={() => setBaseCurrency(currency.code)}
            className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${baseCurrency === currency.code ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
          >
            <img src={currency.flag} alt={currency.code} className="w-8 h-8 rounded-full" />
            <p className="font-black text-sm">{currency.code}</p>
          </button>
        ))}
      </div>

      <button onClick={calculateConversionPreview} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-black transition-all flex items-center justify-center gap-2">
        <RefreshCw size={18} /> Guardar Configuración de Moneda
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl">
            <h4 className="text-lg font-black mb-6">Confirmar Cambio</h4>
            <div className="bg-slate-50 p-4 rounded-xl space-y-3 mb-6">
                <p className="text-xs text-slate-500">Esto ajustará tus valores de caja y presupuesto de {conversionPreview.current.currency} a {conversionPreview.new.currency} usando la tasa actual.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-xl border font-bold text-slate-600">Cancelar</button>
              <button onClick={handleCurrencyChange} disabled={isLoading} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold">{isLoading ? 'Procesando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};