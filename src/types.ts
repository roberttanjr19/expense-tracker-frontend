export interface Category {
  id: number;
  name: string;
  icon?: string | null;
}

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface MonthSummary {
  year: number;
  month: number; // 1-12
  total: number;
  count: number;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  expenseDate: string;
  category: {
    id: number;
    name: string;
    icon?: string | null;
  };
  user: {
    id: number;
    name: string;
  };
}
