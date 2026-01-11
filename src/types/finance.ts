export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense';
  scope: 'business' | 'personal';
  originalAmount: number;
  originalCurrency: string;
  exchangeRate: number;
  amountUSD: number;
  importBatchId?: string; // Nuevo campo para vincular al lote
}

export interface ImportBatch {
  id: string;
  filename: string;
  currency: string;
  record_count: number;
  created_at: string;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  blocked: boolean;
  blockerDescription?: string;
  impact: 'high' | 'medium' | 'low';
  dueDate?: string | null;
}