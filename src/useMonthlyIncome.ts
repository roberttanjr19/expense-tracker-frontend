import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Income } from "./types";
import { authFetch, extractErrorMessage } from "./api";

/**
 * One month's income entries, kept in sync with the period the page is showing.
 * Refetches on its own when the period changes; callers invoke `refetch` after
 * they add, edit or delete an entry.
 *
 * `loading` is true only until the first load resolves.
 *
 * Structured after useBudgetStatus — same `latest` ref for a stable `refetch`
 * identity, same request counter guarding against a slow response for an
 * earlier month landing after a faster one.
 *
 * Unlike useBudgetStatus, failure here is NOT silent. Budget status only
 * decorates data that stands on its own, so it can fail quietly; income IS the
 * subject of the section that uses this, and an empty list would be a lie about
 * the user's money. Errors surface for the caller to render. A 401 still logs
 * out, because authFetch handles that itself.
 */
export function useMonthlyIncome(
  token: string,
  year: number,
  month: number,
  onLogout: () => void
) {
  const [income, setIncome] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Latest arguments in a ref so `refetch` keeps a stable identity and can be
  // called from event handlers without re-subscribing anything. Synced in an
  // effect declared above the fetch effect, so React runs it first and the
  // fetch always reads the current period.
  const latest = useRef({ token, year, month, onLogout });
  useEffect(() => {
    latest.current = { token, year, month, onLogout };
  });

  const requestCount = useRef(0);

  // Nothing in here calls setState synchronously — every update happens after
  // an await. That's what keeps it legal to call straight from an effect
  // (react-hooks/set-state-in-effect), and it's why useBudgetStatus is written
  // the same way. It also means `loading` tracks only the FIRST load: a refetch
  // after adding or deleting an entry updates the list in place rather than
  // flashing the loading line over it.
  const refetch = useCallback(async (): Promise<void> => {
    const args = latest.current;
    const requestId = ++requestCount.current;

    try {
      const response = await authFetch(
        args.token,
        `/api/income?year=${args.year}&month=${args.month}`,
        args.onLogout
      );
      if (!response.ok) throw new Error(await extractErrorMessage(response));
      const data: Income[] = await response.json();

      // A stale response must not overwrite a newer month's data, and must not
      // clear the error or loading state the newer request owns.
      if (requestCount.current !== requestId) return;
      setIncome(data);
      setError("");
    } catch (err) {
      if (requestCount.current !== requestId) return;
      setIncome([]);
      setError(
        err instanceof Error ? err.message : "Couldn't load your income. Please try again."
      );
    } finally {
      if (requestCount.current === requestId) setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [token, year, month, refetch]);

  const total = useMemo(
    () => income.reduce((sum, entry) => sum + entry.amount, 0),
    [income]
  );

  return { income, total, loading, error, refetch };
}
