export interface Transaction {
    id: string;
    date: string;
    description: string;
    category: string;
    type: 'income' | 'expense';
    originalAmount: number;
    originalCurrency: string;
    exchangeRate: number;
    amountUSD: number;
  }