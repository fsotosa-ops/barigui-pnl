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

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  blocked: boolean;
  blockerDescription?: string;
  impact: 'high' | 'medium' | 'low';
  dueDate?: string | null; // Aceptamos null para compatibilidad con DB
}

export interface FinancialProfile {
  annual_budget: number;
  monthly_income: number;
  current_cash: number;
}