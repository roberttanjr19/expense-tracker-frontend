export interface Category {
  id: number;
  name: string;
  icon?: string | null;
  monthlyBudget: number | null;
}

/**
 * One category's standing against its budget for a given month, from
 * GET /api/categories/budget-status. `monthlyBudget` is null when no budget
 * is set; of the remaining pair exactly one is populated — `remaining` while
 * under, `exceeded` once over — so `exceeded != null` is the over-budget test.
 */
export interface CategoryBudgetStatus {
  categoryId: number;
  name: string;
  icon?: string | null;
  monthlyBudget: number | null;
  spent: number;
  remaining: number | null;
  exceeded: number | null;
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
