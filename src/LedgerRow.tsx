import { AlertTriangle, Check, Pencil, Trash2, X } from "lucide-react";
import type { Category, CategoryBudgetStatus, Expense } from "./types";
import { formatMoney, formatMoneyRounded } from "./money";
import { formatCompactDate } from "./date";
import { resolveCategoryIcon } from "./icons";
import { primaryButtonClasses } from "./formStyles";

export interface ExpenseDraft {
  amount: string;
  description: string;
  expenseDate: string;
  categoryId: string;
}

interface LedgerRowProps {
  layout: "table" | "stack";
  expense: Expense;
  categories: Category[];
  banded: boolean;
  isMax: boolean;
  runningTotal: number;
  isEditing: boolean;
  draft: ExpenseDraft;
  saving: boolean;
  editError: string;
  isDeleting: boolean;
  /** Non-null only when this row's category is over budget this month. */
  overBudget: CategoryBudgetStatus | null;
  revealed: boolean;
  onToggleReveal: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onDraftChange: (patch: Partial<ExpenseDraft>) => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}

const chipClasses =
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded px-2 py-1 text-[13px]";

/**
 * The category chip in its warning state: a real button, so it's tabbable and
 * operable by Enter/Space for free, and aria-expanded ties it to the detail it
 * toggles. Takes a render callback for the icon rather than the icon name, so
 * it reuses the row's existing dynamic-icon helper instead of resolving a
 * component inside its own body (which the react-hooks/static-components rule
 * would flag, same reason documented on LedgerRow's categoryIcon below).
 */
function OverBudgetChip({
  name,
  revealed,
  revealId,
  renderIcon,
  onToggle,
}: {
  name: string;
  revealed: boolean;
  revealId: string;
  renderIcon: (size: number, className: string) => React.ReactNode;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={revealed}
      aria-controls={revealId}
      className={`${chipClasses} max-w-full min-w-0 bg-danger-bg text-danger hover:opacity-85 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink`}
    >
      {renderIcon(14, "shrink-0")}
      {/* Truncates rather than pushing the row wide: on mobile this chip
          shares a line with the date and the edit/delete buttons, and a long
          category name there would otherwise force a horizontal scroll. */}
      <span className="truncate">{name}</span>
      <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />
      <span className="sr-only">&mdash; over budget, show details</span>
    </button>
  );
}

/** The revealed line: "{Category} is over budget · $spent / $budget · $x over". */
function BudgetRevealText({ status }: { status: CategoryBudgetStatus }) {
  return (
    <span className="text-[13px] text-dim">
      {status.name} is over budget <span aria-hidden="true">&middot;</span>{" "}
      <span className="font-mono tabular-nums text-ink">
        {formatMoneyRounded(status.spent)} / {formatMoneyRounded(status.monthlyBudget ?? 0)}
      </span>{" "}
      <span aria-hidden="true">&middot;</span>{" "}
      <span className="text-danger">
        <span className="font-mono tabular-nums">
          {formatMoneyRounded(status.exceeded ?? 0)}
        </span>{" "}
        over
      </span>
    </span>
  );
}

const cellInputClasses =
  "h-9 w-full rounded border border-rule bg-paper px-2 text-[14px] text-ink " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const iconButtonClasses =
  "flex h-7 w-7 items-center justify-center rounded text-dim hover:bg-band hover:text-ink disabled:pointer-events-none disabled:opacity-50 " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/**
 * Renders one expense either as a <tr> (desktop table) or a stacked <div>
 * (mobile) depending on `layout`. Both call sites share the same edit draft,
 * which is lifted to Ledger.tsx rather than kept as local state here —
 * that's what keeps a single edit in sync if the viewport crosses the
 * responsive breakpoint mid-edit, and is why there's one row component
 * instead of two.
 */
function LedgerRow({
  layout,
  expense,
  categories,
  banded,
  isMax,
  runningTotal,
  isEditing,
  draft,
  saving,
  editError,
  isDeleting,
  overBudget,
  revealed,
  onToggleReveal,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onSaveEdit,
  onDelete,
}: LedgerRowProps) {
  const revealId = `budget-reveal-${expense.id}`;
  const showReveal = overBudget !== null && revealed;

  // Nested (rather than a top-level `const CategoryIcon = ...`) so the
  // dynamically-resolved icon component isn't flagged by the
  // react-hooks/static-components rule as "a component created during
  // render" — same shape the existing LedgerPreview.tsx map callback uses.
  function categoryIcon(size: number, className: string) {
    const Icon = resolveCategoryIcon(expense.category.icon);
    return <Icon size={size} className={className} aria-hidden="true" />;
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      onSaveEdit();
    } else if (e.key === "Escape") {
      onCancelEdit();
    }
  }

  if (layout === "table") {
    if (isEditing) {
      return (
        <>
          <tr className="bg-band">
            <td className="px-3 py-2">
              <label className="sr-only" htmlFor={`date-${expense.id}`}>
                Date
              </label>
              <input
                id={`date-${expense.id}`}
                type="date"
                value={draft.expenseDate}
                onChange={(e) => onDraftChange({ expenseDate: e.target.value })}
                onKeyDown={handleKeyDown}
                className={`${cellInputClasses} font-mono`}
              />
            </td>
            <td className="px-3 py-2">
              <label className="sr-only" htmlFor={`description-${expense.id}`}>
                Description
              </label>
              <input
                id={`description-${expense.id}`}
                type="text"
                value={draft.description}
                onChange={(e) => onDraftChange({ description: e.target.value })}
                onKeyDown={handleKeyDown}
                className={cellInputClasses}
              />
            </td>
            <td className="px-3 py-2">
              <label className="sr-only" htmlFor={`category-${expense.id}`}>
                Category
              </label>
              <select
                id={`category-${expense.id}`}
                value={draft.categoryId}
                onChange={(e) => onDraftChange({ categoryId: e.target.value })}
                onKeyDown={handleKeyDown}
                className={cellInputClasses}
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </td>
            <td className="px-3 py-2">
              <label className="sr-only" htmlFor={`amount-${expense.id}`}>
                Amount
              </label>
              <input
                id={`amount-${expense.id}`}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => onDraftChange({ amount: e.target.value })}
                onKeyDown={handleKeyDown}
                className={`${cellInputClasses} text-right font-mono tabular-nums`}
              />
            </td>
            <td className="px-3 py-2">
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  aria-label="Save changes"
                  onClick={onSaveEdit}
                  disabled={saving}
                  className={iconButtonClasses}
                >
                  <Check size={16} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Cancel edit"
                  onClick={onCancelEdit}
                  disabled={saving}
                  className={iconButtonClasses}
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>
            </td>
          </tr>
          {editError && (
            <tr className="bg-band">
              <td colSpan={5} className="px-3 pb-2 text-[13px] text-danger">
                {editError}
              </td>
            </tr>
          )}
        </>
      );
    }

    return (
      <>
        <tr className={`group ${banded ? "bg-band" : ""} ${isDeleting ? "opacity-50" : ""}`}>
          <td className="whitespace-nowrap px-3 py-2.5 font-mono text-dim">
            {formatCompactDate(expense.expenseDate)}
          </td>
          <td className="px-3 py-2.5">
            <div className="flex items-center justify-between gap-3">
              <span className="truncate">{expense.description}</span>
              <span className="flex shrink-0 gap-1 opacity-0 group-focus-within:opacity-100 group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Edit entry"
                  onClick={onStartEdit}
                  disabled={isDeleting}
                  className={iconButtonClasses}
                >
                  <Pencil size={15} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  aria-label="Delete entry"
                  onClick={onDelete}
                  disabled={isDeleting}
                  className={iconButtonClasses}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </span>
            </div>
          </td>
          <td className="px-3 py-2.5">
            {overBudget ? (
              <OverBudgetChip
                name={expense.category.name}
                revealed={revealed}
                revealId={revealId}
                renderIcon={categoryIcon}
                onToggle={onToggleReveal}
              />
            ) : (
              <span className={`${chipClasses} bg-chip`}>
                {categoryIcon(14, "shrink-0 text-dim")}
                {expense.category.name}
              </span>
            )}
          </td>
          <td
            className={`whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums ${
              isMax ? "text-accent" : ""
            }`}
          >
            {formatMoney(expense.amount)}
          </td>
          <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono tabular-nums text-dim">
            {formatMoney(runningTotal)}
          </td>
        </tr>

        {/* Its own <tr> rather than an expanding cell: a row can't grow without
            stretching every sibling cell, and this keeps the five-column grid
            intact. Mirrors the shape the edit-error row already uses above.
            Banding is assigned from the expense's index in LedgerTable, so an
            extra DOM row here never shifts the zebra on the rows below. */}
        {showReveal && (
          <tr className={`${banded ? "bg-band" : ""} ${isDeleting ? "opacity-50" : ""}`}>
            <td colSpan={5} className="px-3 pb-2.5">
              <div id={revealId} className="budget-reveal">
                <BudgetRevealText status={overBudget} />
              </div>
            </td>
          </tr>
        )}
      </>
    );
  }

  // Mobile stacked layout.
  if (isEditing) {
    return (
      <div className={`px-4 py-3 ${banded ? "bg-band" : ""}`}>
        <div className="space-y-2">
          <div>
            <label className="mb-1 block text-[13px] text-dim" htmlFor={`m-description-${expense.id}`}>
              Description
            </label>
            <input
              id={`m-description-${expense.id}`}
              type="text"
              value={draft.description}
              onChange={(e) => onDraftChange({ description: e.target.value })}
              onKeyDown={handleKeyDown}
              className={cellInputClasses}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-[13px] text-dim" htmlFor={`m-amount-${expense.id}`}>
                Amount
              </label>
              <input
                id={`m-amount-${expense.id}`}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                value={draft.amount}
                onChange={(e) => onDraftChange({ amount: e.target.value })}
                onKeyDown={handleKeyDown}
                className={`${cellInputClasses} font-mono tabular-nums`}
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[13px] text-dim" htmlFor={`m-date-${expense.id}`}>
                Date
              </label>
              <input
                id={`m-date-${expense.id}`}
                type="date"
                value={draft.expenseDate}
                onChange={(e) => onDraftChange({ expenseDate: e.target.value })}
                onKeyDown={handleKeyDown}
                className={`${cellInputClasses} font-mono`}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[13px] text-dim" htmlFor={`m-category-${expense.id}`}>
              Category
            </label>
            <select
              id={`m-category-${expense.id}`}
              value={draft.categoryId}
              onChange={(e) => onDraftChange({ categoryId: e.target.value })}
              onKeyDown={handleKeyDown}
              className={cellInputClasses}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {editError && <p className="text-[13px] text-danger">{editError}</p>}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onSaveEdit}
              disabled={saving}
              className={`${primaryButtonClasses} h-9`}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={saving}
              className="h-9 flex-1 rounded border border-rule text-[14px] text-ink hover:bg-band disabled:opacity-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-3 ${banded ? "bg-band" : ""} ${isDeleting ? "opacity-50" : ""}`}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate">{expense.description}</span>
        <span className={`shrink-0 font-mono tabular-nums ${isMax ? "text-accent" : ""}`}>
          {formatMoney(expense.amount)}
        </span>
      </div>
      <div className="mt-1 flex items-center gap-1.5 text-[13px] text-dim">
        <span className="font-mono">{formatCompactDate(expense.expenseDate)}</span>
        <span aria-hidden="true">&middot;</span>
        {/* There's no chip on mobile normally — the category is plain text in
            this meta line. Over budget it becomes one, so the warning has a
            real tappable target here too. */}
        {overBudget ? (
          <span className="min-w-0">
            <OverBudgetChip
              name={expense.category.name}
              revealed={revealed}
              revealId={revealId}
              renderIcon={categoryIcon}
              onToggle={onToggleReveal}
            />
          </span>
        ) : (
          <>
            {categoryIcon(13, "shrink-0")}
            <span className="truncate">{expense.category.name}</span>
          </>
        )}
        <span className="ml-auto flex shrink-0 gap-1">
          <button
            type="button"
            aria-label="Edit entry"
            onClick={onStartEdit}
            disabled={isDeleting}
            className={iconButtonClasses}
          >
            <Pencil size={15} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Delete entry"
            onClick={onDelete}
            disabled={isDeleting}
            className={iconButtonClasses}
          >
            <Trash2 size={15} aria-hidden="true" />
          </button>
        </span>
      </div>

      {showReveal && (
        <div id={revealId} className="budget-reveal mt-1.5">
          <BudgetRevealText status={overBudget} />
        </div>
      )}
    </div>
  );
}

export default LedgerRow;
