import type { Expense } from "./types";
import { formatMoney } from "./money";

interface LedgerPreviewProps {
  monthLabel: string;
  expenses: Expense[];
  onOpenLedger: () => void;
}

/**
 * Up to ~4 of the current month's most recent entries, banded. --accent
 * marks whichever row is the largest amount currently on screen (its only
 * job per the token spec — never used on the link below).
 */
function LedgerPreview({ monthLabel, expenses, onOpenLedger }: LedgerPreviewProps) {
  const maxAmount = expenses.length > 0 ? Math.max(...expenses.map((e) => e.amount)) : null;

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      {expenses.length === 0 ? (
        <p className="py-4 text-center text-[15px] text-dim">
          Your ledger is empty. Add your first entry above.
        </p>
      ) : (
        <div>
          {expenses.map((expense, index) => (
            <div
              key={expense.id}
              className={`flex items-center justify-between px-3 py-2.5 text-[15px] ${
                index % 2 === 0 ? "bg-band" : ""
              }`}
            >
              <span className="truncate pr-3">{expense.description}</span>
              <span
                className={`font-mono tabular-nums ${
                  expense.amount === maxAmount ? "text-accent" : ""
                }`}
              >
                {formatMoney(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onOpenLedger}
        className="mt-3 flex w-full items-center justify-between px-3 py-2.5 text-[15px] text-dim hover:text-ink focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <span>Open {monthLabel}&rsquo;s ledger</span>
        <span aria-hidden="true">&rarr;</span>
      </button>
    </section>
  );
}

export default LedgerPreview;
