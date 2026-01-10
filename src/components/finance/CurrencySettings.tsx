'use client';
import { useState, useEffect } from 'react';
import { Globe, TrendingUp, AlertCircle, Save, RefreshCw } from 'lucide-react';
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

  // Cargar configuración actual
  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('base_currency').single();
    if (profile?.base_currency) {
      setBaseCurrency(profile.base_currency);
    }
  };

  // Calcular preview de conversión
  const calculateConversionPreview = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('*').single();
    if (!profile) return;

    const currentRate = rates[baseCurrency] || 1;
    
    // Si la moneda base actual es diferente a USD, convertir a USD primero
    const toUSD = (amount: number) => {
      if (profile.base_currency === 'USD') return amount;
      return convertToUSD(amount, profile.base_currency || 'CLP');
    };

    // Luego convertir de USD a la nueva moneda
    const fromUSD = (amount: number) => {
      if (baseCurrency === 'USD') return amount;
      return amount * currentRate;
    };

    setConversionPreview({
      current: {
        cash: profile.current_cash,
        budget: profile.annual_budget,
        income: profile.monthly_income,
        currency: profile.base_currency || 'CLP'
      },
      new: {
        cash: fromUSD(toUSD(profile.current_cash)),
        budget: fromUSD(toUSD(profile.annual_budget)),
        income: fromUSD(toUSD(profile.monthly_income)),
        currency: baseCurrency
      }
    });

    setShowConfirm(true);
  };

  const handleCurrencyChange = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Actualizar la moneda base
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          base_currency: baseCurrency,
          current_cash: conversionPreview.new.cash,
          annual_budget: conversionPreview.new.budget,
          monthly_income: conversionPreview.new.income
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // 2. Si cambió de moneda, actualizar todas las transacciones futuras
      // (las históricas mantienen su valor en USD para consistencia)
      
      setShowConfirm(false);
      onUpdate?.();
      
      // Mostrar notificación de éxito
      alert('✅ Moneda base actualizada correctamente');
      
    } catch (error) {
      console.error('Error updating currency:', error);
      alert('❌ Error al actualizar la moneda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
          <Globe size={32} />
        </div>
        <div>
          <h3 className="text-xl font-black text-slate-900">Configuración de Moneda Base</h3>
          <p className="text-sm text-slate-500 mt-1">Define la moneda principal para tu operación</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Selector de Moneda */}
        <div className="space-y-4">
          <label className="text-xs font-black text-slate-600 uppercase tracking-widest block">
            Moneda Operativa Principal
          </label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SUPPORTED_CURRENCIES.map((currency) => (
              <button
                key={currency.code}
                onClick={() => setBaseCurrency(currency.code)}
                className={`
                  p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                  ${baseCurrency === currency.code 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                  }
                `}
              >
                <img src={currency.flag} alt={currency.name} className="w-8 h-8 rounded-full" />
                <div className="text-center">
                  <p className="font-black text-sm">{currency.code}</p>
                  <p className="text-[10px] text-slate-500">{currency.name}</p>
                </div>
                {baseCurrency === currency.code && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Info sobre la moneda seleccionada */}
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-bold text-slate-700">
                ¿Qué significa establecer {baseCurrency} como moneda base?
              </p>
              <ul className="space-y-1 text-xs text-slate-600">
                <li>• Todos tus ingresos y gastos se ingresarán por defecto en {baseCurrency}</li>
                <li>• Los reportes mostrarán valores en {baseCurrency} (con opción de convertir)</li>
                <li>• Las metas y presupuestos se definirán en {baseCurrency}</li>
                <li>• Internamente, todo se normaliza a USD para análisis global</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tasas de cambio actuales */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-600 uppercase tracking-widest">
            Tasas de Cambio Actuales (1 USD)
          </h4>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(rates).filter(([code]) => code !== 'USD').map(([code, rate]) => (
              <div key={code} className="bg-slate-50 p-3 rounded-xl flex justify-between items-center">
                <span className="text-sm font-bold text-slate-600">{code}</span>
                <span className="text-sm font-mono text-slate-800">{rate.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-slate-400 italic">
            Tasas actualizadas en tiempo real vía API
          </p>
        </div>

        {/* Botón de Acción */}
        <button
          onClick={calculateConversionPreview}
          className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-sm hover:bg-black transition-all flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />
          Actualizar Moneda Base
        </button>
      </div>

      {/* Modal de Confirmación */}
      {showConfirm && conversionPreview && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl">
            <h4 className="text-lg font-black text-slate-900 mb-6">Confirmar Cambio de Moneda</h4>
            
            <div className="space-y-4 mb-6">
              <p className="text-sm text-slate-600">
                Tus valores se convertirán de <strong>{conversionPreview.current.currency}</strong> a <strong>{conversionPreview.new.currency}</strong>:
              </p>
              
              <div className="space-y-3 bg-slate-50 p-4 rounded-xl">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">CAJA ACTUAL</span>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 line-through">
                      {conversionPreview.current.cash.toLocaleString()} {conversionPreview.current.currency}
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {conversionPreview.new.cash.toLocaleString()} {conversionPreview.new.currency}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">PRESUPUESTO ANUAL</span>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 line-through">
                      {conversionPreview.current.budget.toLocaleString()} {conversionPreview.current.currency}
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {conversionPreview.new.budget.toLocaleString()} {conversionPreview.new.currency}
                    </p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500">INGRESO MENSUAL</span>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 line-through">
                      {conversionPreview.current.income.toLocaleString()} {conversionPreview.current.currency}
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {conversionPreview.new.income.toLocaleString()} {conversionPreview.new.currency}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-sm text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCurrencyChange}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Confirmar Cambio
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};