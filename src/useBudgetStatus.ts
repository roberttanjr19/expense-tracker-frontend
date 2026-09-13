import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CategoryBudgetStatus } from "./types";
import { authFetch, extractErrorMessage } from "./api";

/** How much of the budget is used, 0..n. 0 when there's no positive budget to divide by. */
function usedFraction(status: CategoryBudgetStatus): number {
  const budget = status.monthlyBudget;
  return budget != null && budget > 0 ? status.spent / budget : 0;
}

/**
 * Orders the Home list: over-budget categories first (biggest overage first),
 * then the rest by how much of the budget is already gone — so whichever
 * category is closest to its limit leads the "still fine" group.
 */
function compareUrgency(a: CategoryBudgetStatus, b: CategoryBudgetStatus): number {
  const aOver = a.exceeded != null;
  const bOver = b.exceeded != null;
  if (aOver !== bOver) return aOver ? -1 : 1;
  if (aOver && bOver) return (b.exceeded ?? 0) - (a.exceeded ?? 0);
  return usedFraction(b) - usedFraction(a);
}

/** Bar fill for one budget row, as a 0-100 percentage capped at the budget. */
export function budgetPercent(status: CategoryBudgetStatus): number {
  const budget = status.monthlyBudget;
  // A zero budget can't produce a ratio, so treat any spending against one
  // as a full bar rather than dividing by zero.
  if (budget == null || budget <= 0) return status.spent > 0 ? 100 : 0;
  return Math.min(100, (status.spent / budget) * 100);
}

/**
 * Budget status for one month, kept in sync with whatever month the page is
 * showing. Refetches on its own when the period changes; callers invoke
 * `refetch` after they add, edit or delete an expense (or change a budget).
 *
 * Failure is deliberately silent: this data only decorates the ledger, so a
 * flaky extra request clears the statuses (chips render plain, the Home
 * section hides) instead of surfacing an error over a perfectly good
 * expense list. A 401 still logs out, because authFetch handles that itself.
 */
export function useBudgetStatus(
  token: string,
  year: number,
  month: number,
  onLogout: () => void
) {
  const [statuses, setStatuses] = useState<CategoryBudgetStatus[]>([]);

  // Latest arguments in a ref so `refetch` can keep a stable identity and be
  // called from event handlers without re-subscribing anything. Synced in an
  // effect rather than written during render; because this effect is declared
  // above the fetch effect below, React runs it first, so the fetch always
  // reads the current period.
  const latest = useRef({ token, year, month, onLogout });
  useEffect(() => {
    latest.current = { token, year, month, onLogout };
  });

  // Guards against a slow response for an earlier month landing after a
  // faster one for the month the user has since stepped to.
  const requestCount = useRef(0);

  /** Also returns what it fetched, so callers can act on fresh data immediately. */
  const refetch = useCallback(async (): Promise<CategoryBudgetStatus[]> => {
    const args = latest.current;
    const requestId = ++requestCount.current;

    try {
      const response = await authFetch(
        args.token,
        `/api/categories/budget-status?year=${args.year}&month=${args.month}`,
        args.onLogout
      );
      if (!response.ok) throw new Error(await extractErrorMessage(response));
      const data: CategoryBudgetStatus[] = await response.json();
      if (requestCount.current === requestId) setStatuses(data);
      return data;
    } catch {
      if (requestCount.current === requestId) setStatuses([]);
      return [];
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [token, year, month, refetch]);

  const statusByCategoryId = useMemo(
    () => new Map(statuses.map((status) => [status.categoryId, status])),
    [statuses]
  );

  const budgeted = useMemo(
    () => statuses.filter((s) => s.monthlyBudget != null).sort(compareUrgency),
    [statuses]
  );

  return { statusByCategoryId, budgeted, refetch };
}
