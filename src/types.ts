export interface Category {
  id: number;
  name: string;
}

export interface Expense {
  id: number;
  amount: number;
  description: string;
  expenseDate: string;
  category: {
    id: number;
    name: string;
  };
  user: {
    id: number;
    name: string;
  };
}
