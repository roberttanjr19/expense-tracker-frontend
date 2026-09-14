import type { Expense } from "./types";
import { formatMoney } from "./money";
import { resolveCategoryIcon } from "./icons";

interface LedgerPreviewProps {
  monthLabel: string;
  expenses: Expense[];
  categoryIconById: Map<number, string | null | undefined>;
  onOpenLedger: () => void;
}

/**
 * "This month": up to ~4 of the current month's most recent entries, banded.
 * --accent marks whichever row is the largest amount currently on screen
 * (its only job per the token spec — never used on the link below).
 *
 * On desktop this is the right-hand column of a two-column grid (see
 * Home.tsx), set off from the form by its own border-l hairline. The entries
 * block below the heading is flex-1, so on desktop — where the grid stretches
 * both columns to equal height by default — the "Open ledger" link gets
 * pushed down to the bottom of the column instead of sitting right under
 * a short entries list. On mobile there's no stretched height to fill, so
 * flex-1 is a no-op and the link just follows the content as before.
 */
function LedgerPreview({
  monthLabel,
  expenses,
  categoryIconById,
  onOpenLedger,
}: LedgerPreviewProps) {
  const maxAmount = expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount)) : null;

  return (
    <section className="card flex flex-col p-5">
      <p className="eyebrow">This month</p>

      <div className="mt-4 flex-1">
        {expenses.length === 0 ? (
          <p className="py-4 text-center text-[15px] text-dim">
            Your ledger is empty. Add your first entry above.
          </p>
        ) : (
          <div>
            {expenses.map((expense, index) => {
              const CategoryIcon = resolveCategoryIcon(
                categoryIconById.get(expense.category.id)
              );
              return (
                <div
                  key={expense.id}
                  // Rounded because the banding now sits inside a card's
                  // padding rather than running full-bleed across the page.
                  // Hover shifts the background only — these rows aren't
                  // clickable, so they mustn't lift like something that is.
                  className={`flex items-center justify-between rounded-[8px] px-3 py-2.5 text-[15px] transition-colors hover:bg-chip ${
                    index % 2 === 0 ? "bg-band" : ""
                  }`}
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2 pr-3">
                    <CategoryIcon size={16} className="shrink-0 text-dim" aria-hidden="true" />
                    <span className="truncate">{expense.description}</span>
                  </span>
                  <span
                    className={`font-mono tabular-nums ${
                      expense.amount === maxAmount ? "text-accent" : ""
                    }`}
                  >
                    {formatMoney(expense.amount)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenLedger}
        className="mt-auto flex w-full items-center justify-between rounded-[8px] border-t border-[color:var(--card-border)] px-3 pt-3 pb-1 text-[15px] text-dim transition-colors hover:text-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span>Open {monthLabel}&rsquo;s ledger</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </section>
  );
}

export default LedgerPreview;
