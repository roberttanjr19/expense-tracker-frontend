import { AlertTriangle } from "lucide-react";
import type { CategoryBudgetStatus } from "./types";
import { formatMoneyRounded } from "./money";
import { resolveCategoryIcon } from "./icons";
import { budgetPercent } from "./useBudgetStatus";

interface BudgetListProps {
  /** Only categories that have a budget, already sorted over-budget first. */
  budgets: CategoryBudgetStatus[];
}

/**
 * "Budgets": one compact row per category that actually has a monthly budget,
 * for the month currently selected on Home. Categories without a budget are
 * left out entirely — the list is meant to be a short glance, not a roster.
 *
 * Bar geometry (label column / h-2 track / right-aligned figure) matches
 * Breakdown's "Where it went" on the ledger page on purpose, so the two read
 * as the same kind of object in two places.
 */
function BudgetList({ budgets }: BudgetListProps) {
  if (budgets.length === 0) return null;

  const overCount = budgets.filter((b) => b.exceeded != null).length;

  return (
    <section className="border-b border-rule py-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Budgets</p>
        {overCount > 0 && (
          <p className="eyebrow whitespace-nowrap text-danger">
            {overCount} over
          </p>
        )}
      </div>

      {/* Two columns once there's room for them: the rows are short, and a
          single column of them would leave a long empty gutter on desktop. */}
      <div className="mt-4 grid gap-3 min-[900px]:grid-cols-2 min-[900px]:gap-x-10">
        {budgets.map((budget) => {
          const CategoryIcon = resolveCategoryIcon(budget.icon);
          const over = budget.exceeded != null;

          return (
            <div key={budget.categoryId} className="flex items-center gap-3">
              <span className="flex w-24 shrink-0 items-center gap-1.5 text-[13px] min-[420px]:w-32">
                <CategoryIcon
                  size={14}
                  className={`shrink-0 ${over ? "text-danger" : "text-dim"}`}
                  aria-hidden="true"
                />
                <span className="truncate">{budget.name}</span>
              </span>

              {/* Decorative: the figure to its right already states the same
                  thing in words, so there's nothing here for a screen reader. */}
              <div className="h-2 min-w-0 flex-1 rounded-full bg-band" aria-hidden="true">
                <div
                  className={`h-2 rounded-full ${over ? "bg-danger" : "bg-ink"}`}
                  style={{ width: `${budgetPercent(budget)}%` }}
                />
              </div>

              <span
                className={`flex w-[84px] shrink-0 items-center justify-end gap-1 whitespace-nowrap text-[13px] min-[420px]:w-24 ${
                  over ? "text-danger" : "text-accent"
                }`}
              >
                {over && <AlertTriangle size={12} className="shrink-0" aria-hidden="true" />}
                <span className="font-mono tabular-nums">
                  {formatMoneyRounded(over ? budget.exceeded ?? 0 : budget.remaining ?? 0)}
                </span>
                {over ? "over" : "left"}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default BudgetList;
