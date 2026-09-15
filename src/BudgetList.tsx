import { AlertTriangle, Tags } from "lucide-react";
import type { CategoryBudgetStatus } from "./types";
import { formatMoneyRounded } from "./money";
import { resolveCategoryIcon } from "./icons";
import { budgetPercent } from "./useBudgetStatus";

interface BudgetListProps {
  /** Only categories that have a budget, already sorted over-budget first. */
  budgets: CategoryBudgetStatus[];
  /** Opens the category management panel — budgets are set there. */
  onManageCategories: () => void;
}

/**
 * "Budgets": one compact row per category that actually has a monthly budget,
 * for the month currently selected on Home. Categories without a budget are
 * left out entirely — the list is meant to be a short glance, not a roster.
 *
 * Bar geometry (label column / h-2 track / right-aligned figure) matches
 * Breakdown's "Where it went" on the ledger page on purpose, so the two read
 * as the same kind of object in two places.
 *
 * This no longer returns null when there is nothing to show. The "Manage
 * categories" action lives in this card's footer, and setting a budget is only
 * possible through that panel — so hiding the card when no budgets exist would
 * strand a new user with no way to create their first one.
 */
function BudgetList({ budgets, onManageCategories }: BudgetListProps) {
  const overCount = budgets.filter((b) => b.exceeded != null).length;

  return (
    <section className="card p-5">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Budgets</p>
        {overCount > 0 && (
          <p className="eyebrow whitespace-nowrap text-danger">
            {overCount} over
          </p>
        )}
      </div>

      {budgets.length === 0 ? (
        <p className="mt-4 text-[15px] text-dim">
          No budgets set yet. Add a monthly budget to a category to track it here.
        </p>
      ) : (
        /* Two columns once there's room for them: the rows are short, and a
           single column of them would leave a long empty gutter on desktop. */
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
      )}

      {/*
        Budgets and categories are the same underlying object, so the entry
        point to the panel lives here rather than in its own section. The
        divider uses --card-border (the card's own hairline) rather than
        --rule, which reads too strong inside a card.
      */}
      <div className="mt-5 border-t border-[color:var(--card-border)] pt-4">
        <button
          type="button"
          onClick={onManageCategories}
          className="flex w-full items-center justify-between rounded-[10px] border-[0.5px] border-rule px-4 py-3 text-left transition-colors hover:bg-band focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
        >
          <span className="flex items-center gap-2.5">
            <Tags size={16} className="shrink-0 text-dim" aria-hidden="true" />
            <span className="text-[15px]">Manage budgets</span>
          </span>
          <span aria-hidden="true" className="text-dim">
            &rarr;
          </span>
        </button>
      </div>
    </section>
  );
}

export default BudgetList;
