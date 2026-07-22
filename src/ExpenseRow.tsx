import { useEffect, useState } from "react";
import type { Category, Expense } from "./types";

export interface ExpensePayload {
  amount: number;
  description: string;
  expenseDate: string;
  categoryId: number;
}

interface ExpenseRowProps {
  expense: Expense;
  categories: Category[];
  isEditing: boolean;
  saving: boolean;
  editError: string;
  deleting: boolean;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (id: number, payload: ExpensePayload) => void;
  onDelete: (id: number) => void;
}

function ExpenseRow({
  expense,
  categories,
  isEditing,
  saving,
  editError,
  deleting,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: ExpenseRowProps) {
  const [description, setDescription] = useState(expense.description);
  const [amount, setAmount] = useState(String(expense.amount));
  const [expenseDate, setExpenseDate] = useState(expense.expenseDate);
  const [categoryId, setCategoryId] = useState(String(expense.category.id));

  // This row stays mounted across edits (only `isEditing` toggles), so the
  // form fields need to be re-synced from the expense each time edit mode
  // is entered rather than just on first render.
  useEffect(() => {
    if (isEditing) {
      setDescription(expense.description);
      setAmount(String(expense.amount));
      setExpenseDate(expense.expenseDate);
      setCategoryId(String(expense.category.id));
    }
  }, [isEditing, expense]);

  if (isEditing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(expense.id, {
            amount: parseFloat(amount),
            description,
            expenseDate,
            categoryId: parseInt(categoryId, 10),
          });
        }}
        className="rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm space-y-3"
      >
        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded border border-gray-300 p-2"
        />

        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full rounded border border-gray-300 p-2"
        />

        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          required
          className="w-full rounded border border-gray-300 p-2"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
          className="w-full rounded border border-gray-300 p-2"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {editError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {editError}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={saving}
            className="flex-1 rounded border border-gray-300 p-2 font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex justify-between items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <p className="font-medium text-gray-900">{expense.description}</p>
        <p className="text-sm text-gray-500">
          {expense.category.name} &middot; {expense.expenseDate}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <p className="text-lg font-semibold text-gray-900">
          ${expense.amount.toFixed(2)}
        </p>
        <button
          type="button"
          onClick={onStartEdit}
          className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(expense.id)}
          disabled={deleting}
          className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 disabled:no-underline"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}

export default ExpenseRow;
