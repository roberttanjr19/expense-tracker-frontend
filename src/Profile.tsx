import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Tags } from "lucide-react";
import type { MonthSummary, User } from "./types";
import { authFetch, extractErrorMessage } from "./api";
import HeaderMenu from "./HeaderMenu";
import ThemeToggle from "./ThemeToggle";
import CategoryManager from "./CategoryManager";
import BudgetList from "./BudgetList";
import PreviousMonths from "./PreviousMonths";
import { useBudgetStatus } from "./useBudgetStatus";

interface ProfileProps {
  token: string;
  onLogout: () => void;
}

/**
 * Everything the home screen used to carry that isn't "log an expense":
 * who you're signed in as, this month's budgets, category management, and
 * the month-by-month ledger index.
 *
 * BudgetList, PreviousMonths and CategoryManager are the same components
 * home used — they're mounted here instead, not reimplemented, so they
 * fetch and behave exactly as before.
 *
 * Unlike home and the ledger page there is no period stepper: budgets are
 * always shown for the real current month, so `today` is read once at mount
 * and never moves.
 */
function Profile({ token, onLogout }: ProfileProps) {
  const navigate = useNavigate();

  const [today] = useState(() => new Date());
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const [user, setUser] = useState<User | null>(null);
  const [monthSummaries, setMonthSummaries] = useState<MonthSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [managingCategories, setManagingCategories] = useState(false);

  // Fetches itself for this month; nothing here can change the period.
  const { budgeted, refetch: refetchBudgets } = useBudgetStatus(token, year, month, onLogout);

  async function loadProfile() {
    setLoading(true);
    setSlowLoading(false);
    setLoadError("");
    // Same Render free-tier cold start the other pages warn about.
    const slowTimer = setTimeout(() => setSlowLoading(true), 3000);

    try {
      const [meRes, summaryRes] = await Promise.all([
        authFetch(token, "/api/users/me", onLogout),
        authFetch(token, "/api/expenses/summary/months", onLogout),
      ]);

      if (!meRes.ok) throw new Error(await extractErrorMessage(meRes));
      if (!summaryRes.ok) throw new Error(await extractErrorMessage(summaryRes));

      setUser(await meRes.json());
      setMonthSummaries(await summaryRes.json());
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Couldn't load your profile. Please try again."
      );
    } finally {
      clearTimeout(slowTimer);
      setSlowLoading(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Budgets are set in the category panel, so both have to come back. */
  async function handleCategoriesChanged() {
    await Promise.all([loadProfile(), refetchBudgets()]);
  }

  // Same derivation home used, against the current month rather than a
  // stepped one: drop the month in progress, cap the list, sum everything.
  const otherMonths = monthSummaries.filter((s) => !(s.year === year && s.month === month));
  const visibleMonths = otherMonths.slice(0, 12);
  const hasMoreMonths = otherMonths.length > 12;
  const allTimeTotal = monthSummaries.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="flex min-h-screen flex-col dot-grid text-ink">
      <header className="border-b border-rule bg-paper">
        <div className="mx-auto flex w-full max-w-[640px] items-center justify-between px-4 py-4 sm:px-6 sm:py-5 min-[900px]:max-w-[1100px] min-[900px]:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Back to home"
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded text-ink hover:bg-band focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <h1 className="text-[16px] font-medium">Profile</h1>
          </div>

          <div className="flex items-center gap-1">
            <ThemeToggle />
            <HeaderMenu onSignOut={onLogout} />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col bg-paper items-center justify-center gap-2 px-4 text-center">
          <p className="text-[15px] text-dim">Loading&hellip;</p>
          {slowLoading && (
            <p className="max-w-xs text-sm text-dim">
              Waking the server up &mdash; this takes up to a minute on first load.
            </p>
          )}
        </div>
      ) : loadError ? (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col bg-paper items-center justify-center px-4 text-center">
          <p className="text-[15px] text-danger">{loadError}</p>
        </div>
      ) : (
        <main className="mx-auto bg-paper w-full max-w-[640px] flex-1 px-4 sm:px-6 min-[900px]:max-w-[1100px] min-[900px]:px-8">
          <section className="border-b border-rule py-8">
            <p className="eyebrow">Signed in as</p>
            <p className="mt-2 text-[19px] font-medium">{user?.name}</p>
            {/* break-all so a long address wraps instead of widening the
                page at 320px. */}
            <p className="mt-0.5 break-all text-[15px] text-dim">{user?.email}</p>
          </section>

          <BudgetList budgets={budgeted} />

          <section className="py-8">
            <p className="eyebrow">Categories</p>
            <button
              type="button"
              onClick={() => setManagingCategories(true)}
              className="mt-4 flex w-full items-center justify-between rounded-[10px] border-[0.5px] border-rule bg-paper px-4 py-3 text-left transition-colors hover:bg-band focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <span className="flex items-center gap-2.5">
                <Tags size={16} className="shrink-0 text-dim" aria-hidden="true" />
                <span className="text-[15px]">Manage categories</span>
              </span>
              <span aria-hidden="true" className="text-dim">
                &rarr;
              </span>
            </button>
          </section>

          <PreviousMonths
            months={visibleMonths}
            hasMore={hasMoreMonths}
            allTimeTotal={allTimeTotal}
            onOpenMonth={(y, m) => navigate(`/ledger/${y}/${m}`)}
          />
        </main>
      )}

      <CategoryManager
        open={managingCategories}
        onClose={() => setManagingCategories(false)}
        token={token}
        onLogout={onLogout}
        onCategoriesChanged={handleCategoriesChanged}
      />
    </div>
  );
}

export default Profile;
