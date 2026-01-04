'use client';
import { useState, useEffect } from 'react';

// Tasas por defecto (Fallback por si falla la API)
const DEFAULT_RATES: Record<string, number> = {
  USD: 1.0,
  BRL: 5.40,
  CLP: 950,
  EUR: 0.92,
  COP: 3900,
  MXN: 17.50
};

export const useExchangeRates = () => {
  const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRates = async () => {
      try {
        // Obtenemos tasas con base en USD
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        
        // La API devuelve cuánto vale 1 USD en cada moneda.
        // Ejemplo: data.rates.BRL = 5.45 (1 USD = 5.45 BRL)
        // Para tu app, necesitas el inverso para convertir (multiplicar monto local por factor para llegar a USD)
        // O simplemente usas la lógica: MontoUSD = MontoLocal / TasaAPI
        
        // Vamos a guardar las tasas directas de la API para usarlas matemáticamente
        setRates(data.rates);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching rates:", error);
        setLoading(false); // Usamos las default si falla
      }
    };

    fetchRates();
  }, []);

  // Función helper para convertir CUALQUIER moneda a USD
  const convertToUSD = (amount: number, currencyCode: string) => {
    if (currencyCode === 'USD') return amount;
    
    const rate = rates[currencyCode];
    if (!rate) return 0;

    // Si 1 USD = 950 CLP, entonces 1000 CLP = 1000 / 950 USD
    return parseFloat((amount / rate).toFixed(2));
  };

  // Función para obtener la tasa inversa (para mostrar en UI: 1 CLP = 0.00105 USD)
  const getInverseRate = (currencyCode: string) => {
    const rate = rates[currencyCode];
    return rate ? parseFloat((1 / rate).toFixed(6)) : 0;
  };

  return { rates, loading, convertToUSD, getInverseRate };
};