import { useMemo } from "react";
import type { Category, CategoryBudgetStatus, Expense } from "./types";
import { formatMoney } from "./money";
import LedgerRow from "./LedgerRow";
import type { ExpenseDraft } from "./LedgerRow";

interface LedgerTableProps {
  expenses: Expense[];
  categories: Category[];
  monthLabel: string;
  editingId: number | null;
  editDraft: ExpenseDraft;
  saving: boolean;
  editError: string;
  deletingId: number | null;
  /** Empty when budget status is unavailable, which leaves every chip plain. */
  statusByCategoryId: Map<number, CategoryBudgetStatus>;
  revealedRowIds: ReadonlySet<number>;
  onToggleReveal: (expenseId: number) => void;
  onStartEdit: (expense: Expense) => void;
  onCancelEdit: () => void;
  onDraftChange: (patch: Partial<ExpenseDraft>) => void;
  onSaveEdit: () => void;
  onDelete: (id: number) => void;
}

const headerCellClasses = "eyebrow px-3 pb-2 text-left font-medium";

function LedgerTable({
  expenses,
  categories,
  monthLabel,
  editingId,
  editDraft,
  saving,
  editError,
  deletingId,
  statusByCategoryId,
  revealedRowIds,
  onToggleReveal,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onSaveEdit,
  onDelete,
}: LedgerTableProps) {
  // Expenses arrive oldest-first from the backend; ascending order is
  // required here so the running total accumulates correctly as we walk
  // forward through the month.
  const runningTotals = useMemo(
    () =>
      expenses.reduce<number[]>((totals, expense) => {
        const previous = totals.length > 0 ? totals[totals.length - 1] : 0;
        totals.push(previous + expense.amount);
        return totals;
      }, []),
    [expenses]
  );

  const monthTotal = runningTotals.length > 0 ? runningTotals[runningTotals.length - 1] : 0;

  // Found by first occurrence rather than by value, so a tie between two
  // entries still highlights exactly one row, not both.
  const maxIndex = useMemo(() => {
    if (expenses.length === 0) return -1;
    let best = 0;
    for (let i = 1; i < expenses.length; i++) {
      if (expenses[i].amount > expenses[best].amount) best = i;
    }
    return best;
  }, [expenses]);

  function rowProps(expense: Expense, index: number) {
    const isEditing = editingId === expense.id;
    // Only an over-budget status reaches the row; under-budget and no-budget
    // categories hand down null, which is what keeps their chips untouched.
    const status = statusByCategoryId.get(expense.category.id);
    const overBudget = status && status.exceeded != null ? status : null;
    return {
      expense,
      categories,
      banded: index % 2 === 0,
      isMax: index === maxIndex,
      runningTotal: runningTotals[index],
      isEditing,
      draft: editDraft,
      saving,
      editError: isEditing ? editError : "",
      isDeleting: deletingId === expense.id,
      overBudget,
      revealed: revealedRowIds.has(expense.id),
      onToggleReveal: () => onToggleReveal(expense.id),
      onStartEdit: () => onStartEdit(expense),
      onCancelEdit,
      onDraftChange,
      onSaveEdit,
      onDelete: () => onDelete(expense.id),
    };
  }

  return (
    <div>
      <div className="hidden overflow-x-auto min-[700px]:block">
        <table className="w-full text-[15px]">
          <thead>
            <tr className="border-b border-rule">
              <th className={headerCellClasses}>Date</th>
              <th className={headerCellClasses}>Description</th>
              <th className={headerCellClasses}>Category</th>
              <th className={`${headerCellClasses} text-right`}>Amount</th>
              <th className={`${headerCellClasses} text-right`}>Running</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, index) => (
              <LedgerRow key={expense.id} layout="table" {...rowProps(expense, index)} />
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-rule">
              <td colSpan={3} className="px-3 py-3 font-medium">
                Total for {monthLabel}
              </td>
              <td className="px-3 py-3 text-right font-mono tabular-nums font-medium">
                {formatMoney(monthTotal)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="min-[700px]:hidden">
        {expenses.map((expense, index) => (
          <LedgerRow key={expense.id} layout="stack" {...rowProps(expense, index)} />
        ))}
        <div className="flex items-baseline justify-between border-t border-rule px-4 py-3 font-medium">
          <span>Total for {monthLabel}</span>
          <span className="font-mono tabular-nums">{formatMoney(monthTotal)}</span>
        </div>
      </div>
    </div>
  );
}

export default LedgerTable;
