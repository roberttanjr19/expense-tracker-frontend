import { Pencil, Trash2 } from "lucide-react";
import type { Income } from "./types";
import { formatMoney } from "./money";
import { formatCompactDate } from "./date";
import {
  iconButtonClasses,
  inputClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
} from "./formStyles";

/** The in-progress edit, all strings because it's bound straight to inputs. */
export interface IncomeDraft {
  source: string;
  amount: string;
  incomeDate: string;
  description: string;
}

interface IncomeRowProps {
  entry: Income;
  banded: boolean;
  isEditing: boolean;
  saving: boolean;
  deleting: boolean;
  editError: string;
  editDraft: IncomeDraft;
  onDraftChange: (patch: Partial<IncomeDraft>) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
}

/**
 * One income entry: a banded read-only row that swaps in place for an edit
 * form. Mirrors LedgerRow — fully controlled, with the draft owned by the
 * parent section. That's why there's no local state here and no effect
 * re-syncing it: entering edit mode seeds the draft in the parent, so there's
 * nothing to keep in step.
 */
function IncomeRow({
  entry,
  banded,
  isEditing,
  saving,
  deleting,
  editError,
  editDraft,
  onDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: IncomeRowProps) {
  if (isEditing) {
    return (
      <li className={banded ? "bg-band" : ""}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSaveEdit();
          }}
          className="space-y-3 px-4 py-3"
        >
          <div className="grid gap-3 min-[520px]:grid-cols-2">
            <div>
              <label htmlFor={`income-source-${entry.id}`} className="sr-only">
                Source
              </label>
              <input
                id={`income-source-${entry.id}`}
                type="text"
                placeholder="Source"
                value={editDraft.source}
                onChange={(e) => onDraftChange({ source: e.target.value })}
                required
                className={inputClasses}
              />
            </div>

            <div>
              <label htmlFor={`income-amount-${entry.id}`} className="sr-only">
                Amount
              </label>
              <input
                id={`income-amount-${entry.id}`}
                type="number"
                step="0.01"
                min="0"
                inputMode="decimal"
                placeholder="Amount"
                value={editDraft.amount}
                onChange={(e) => onDraftChange({ amount: e.target.value })}
                required
                className={`${inputClasses} font-mono tabular-nums`}
              />
            </div>

            <div>
              <label htmlFor={`income-date-${entry.id}`} className="sr-only">
                Date
              </label>
              <input
                id={`income-date-${entry.id}`}
                type="date"
                value={editDraft.incomeDate}
                onChange={(e) => onDraftChange({ incomeDate: e.target.value })}
                required
                className={`${inputClasses} date-input`}
              />
            </div>

            <div>
              <label htmlFor={`income-description-${entry.id}`} className="sr-only">
                Description (optional)
              </label>
              <input
                id={`income-description-${entry.id}`}
                type="text"
                placeholder="Description (optional)"
                value={editDraft.description}
                onChange={(e) => onDraftChange({ description: e.target.value })}
                className={inputClasses}
              />
            </div>
          </div>

          {editError && (
            <p role="alert" className="text-[13px] text-danger">
              {editError}
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className={`${primaryButtonClasses} h-9 flex-1`}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={saving}
              className={`${secondaryButtonClasses} h-9 flex-1`}
            >
              Cancel
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li
      className={`flex items-baseline gap-3 px-4 py-2.5 ${banded ? "bg-band" : ""} ${
        deleting ? "opacity-50" : ""
      }`}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">{entry.source}</span>
        <span className="flex items-center gap-1.5 text-[13px] text-dim">
          <span className="font-mono">{formatCompactDate(entry.incomeDate)}</span>
          {entry.description && (
            <>
              <span aria-hidden="true">&middot;</span>
              <span className="truncate">{entry.description}</span>
            </>
          )}
        </span>
      </span>

      <span className="shrink-0 font-mono tabular-nums text-accent">
        {formatMoney(entry.amount)}
      </span>

      <span className="flex shrink-0 gap-1 self-center">
        <button
          type="button"
          aria-label={`Edit income from ${entry.source}`}
          onClick={onStartEdit}
          disabled={deleting}
          className={iconButtonClasses}
        >
          <Pencil size={15} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label={`Delete income from ${entry.source}`}
          onClick={onDelete}
          disabled={deleting}
          className={iconButtonClasses}
        >
          <Trash2 size={15} aria-hidden="true" />
        </button>
      </span>
    </li>
  );
}

export default IncomeRow;
