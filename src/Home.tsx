import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserRound } from "lucide-react";
import type { Category, Expense, Income } from "./types";
import { authFetch, extractErrorMessage } from "./api";
import { monthName } from "./date";
import { inputClasses, linkButtonClasses, primaryButtonBoldClasses } from "./formStyles";
import Logo from "./Logo";
import HeaderMenu from "./HeaderMenu";
import CategoryManager from "./CategoryManager";
import PeriodStepper from "./PeriodStepper";
import SummaryStrip from "./SummaryStrip";
import LedgerPreview from "./LedgerPreview";
import ColdStartLoader from "./ColdStartLoader";

interface HomeProps {
  token: string;
  onLogout: () => void;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function Home({ token, onLogout }: HomeProps) {
  const navigate = useNavigate();
  // Fixed at mount rather than recomputed on every render, so the screen
  // doesn't shift "current month" out from under the user at midnight.
  const [today] = useState(() => new Date());
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  // The period currently being viewed. Starts on the real current month and
  // moves independently of `today` as the user steps through the header's
  // period stepper.
  const [period, setPeriod] = useState(() => ({ year: todayYear, month: todayMonth }));
  const { year, month } = period;
  const monthLabel = useMemo(() => monthName(year, month), [year, month]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [income, setIncome] = useState<Income[]>([]);

  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => toIsoDate(today));
  const [categoryId, setCategoryId] = useState("");
  const [expenseError, setExpenseError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [managingCategories, setManagingCategories] = useState(false);

  async function loadAll() {
    setLoading(true);
    setSlowLoading(false);
    setLoadError("");
    // Render's free tier sleeps after inactivity, so the first request after
    // a while can take up to a minute. If we're still waiting past ~3s,
    // assume that's what's happening and say so.
    const slowTimer = setTimeout(() => setSlowLoading(true), 3000);

    try {
      const [expensesRes, categoriesRes, incomeRes] = await Promise.all([
        authFetch(token, `/api/expenses?year=${year}&month=${month}`, onLogout),
        authFetch(token, "/api/categories", onLogout),
        authFetch(token, `/api/income?year=${year}&month=${month}`, onLogout),
      ]);

      if (!expensesRes.ok) throw new Error(await extractErrorMessage(expensesRes));
      if (!categoriesRes.ok) throw new Error(await extractErrorMessage(categoriesRes));
      if (!incomeRes.ok) throw new Error(await extractErrorMessage(incomeRes));

      setExpenses(await expensesRes.json());
      setCategories(await categoriesRes.json());
      setIncome(await incomeRes.json());
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Couldn't load your data. Please try again."
      );
    } finally {
      clearTimeout(slowTimer);
      setSlowLoading(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  // Only the month's own entries: the summary-months and budget-status
  // requests that used to ride along here fed the "vs last month" cell,
  // Budgets and Previous months, all of which now live on /profile.
  async function refetchExpenses() {
    const response = await authFetch(token, `/api/expenses?year=${year}&month=${month}`, onLogout);
    if (response.ok) setExpenses(await response.json());
  }

  async function handleAddExpense(e: React.FormEvent) {
    e.preventDefault();
    setExpenseError("");
    setSubmitting(true);

    try {
      const response = await authFetch(token, "/api/expenses", onLogout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          expenseDate,
          categoryId: parseInt(categoryId, 10),
        }),
      });

      if (!response.ok) throw new Error(await extractErrorMessage(response));

      setDescription("");
      setAmount("");
      setExpenseDate(toIsoDate(today));
      setCategoryId("");
      await refetchExpenses();
    } catch (err) {
      setExpenseError(
        err instanceof Error ? err.message : "Couldn't add that entry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleOpenLedger() {
    navigate(`/ledger/${year}/${month}`);
  }

  const isAtOrAfterCurrentMonth =
    year > todayYear || (year === todayYear && month >= todayMonth);

  function goToPrevMonth() {
    setPeriod((current) =>
      current.month === 1
        ? { year: current.year - 1, month: 12 }
        : { year: current.year, month: current.month - 1 }
    );
  }

  function goToNextMonth() {
    if (isAtOrAfterCurrentMonth) return;
    setPeriod((current) =>
      current.month === 12
        ? { year: current.year + 1, month: 1 }
        : { year: current.year, month: current.month + 1 }
    );
  }

  const monthTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const monthIncome = useMemo(
    () => income.reduce((sum, i) => sum + i.amount, 0),
    [income]
  );

  const recentExpenses = useMemo(() => [...expenses].slice(-4).reverse(), [expenses]);

  const categoryIconById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.icon])),
    [categories]
  );

  return (
    <div className="flex min-h-screen flex-col dot-grid text-ink">
      {/* Not a card — a solid band the cards scroll under. */}
      <header className="border-b border-rule bg-paper px-4 py-4 sm:px-6 sm:py-5 min-[900px]:px-8">
        {/*
          Desktop (>=640px): three zones, 1fr | auto | 1fr. The equal side
          columns are what keep the pill dead-centre at any width — it replaces
          the old absolutely positioned copy AND the duplicate mobile one below
          it, so the stepper is now rendered once instead of twice.

          Mobile: two columns and two rows instead. The pill is
          whitespace-nowrap and can't shrink, so on a narrow screen the middle
          `auto` track pushed the three zones wider than the viewport and the
          pill collided with the wordmark. `order-last` moves it after the
          actions in grid auto-placement, so it wraps onto a second row
          spanning both columns — logo left and icons right above it, pill
          centred below. Nothing overlaps and nothing scrolls sideways.
        */}
        <div className="grid w-full grid-cols-2 items-center gap-x-2 gap-y-3 sm:grid-cols-[1fr_auto_1fr] sm:gap-y-0">
          <div className="flex min-w-0 items-center gap-2">
            <Logo size={26} className="shrink-0 text-ink" />
            {/* Still hidden under 420px. The pill no longer shares this row at
                that width, so this is now only about keeping the logo and the
                action icons comfortable on the narrowest phones. */}
            <span className="hidden text-[19px] font-bold min-[420px]:inline">Daybook</span>
          </div>

          <div className="order-last col-span-2 flex min-w-0 justify-center sm:order-none sm:col-span-1">
            <PeriodStepper
              variant="raised"
              monthLabel={monthLabel}
              year={year}
              nextDisabled={isAtOrAfterCurrentMonth}
              onPrev={goToPrevMonth}
              onNext={goToNextMonth}
            />
          </div>

          {/* A real <Link>, not a button+navigate, so it opens in a new tab
              on middle-click and shows its target on hover like a link should. */}
          <div className="flex min-w-0 items-center justify-end gap-1">
            <Link
              to="/profile"
              aria-label="Profile"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-ink hover:bg-band focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <UserRound size={18} aria-hidden="true" />
            </Link>
            <HeaderMenu onSignOut={onLogout} />
          </div>
        </div>
      </header>

      {loading ? (
        <ColdStartLoader quietLabel="Loading your ledger…" slow={slowLoading} />
      ) : loadError ? (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col bg-paper items-center justify-center px-4 text-center">
          <p className="text-[15px] text-danger">{loadError}</p>
        </div>
      ) : (
        <main
          // No bg-paper here any more. It was added so the dot grid never sat
          // behind text; the cards below now carry all the text on their own
          // opaque surfaces, so the page can go transparent and the dots show
          // between and around them — which is the whole point of the layout.
          className="mx-auto w-full max-w-[640px] flex-1 px-4 py-[var(--card-gap)] sm:px-6 min-[900px]:max-w-[1100px] min-[900px]:px-8"
        >
          <SummaryStrip income={monthIncome} spent={monthTotal} />

          {/*
            1.1fr / 1fr — an intentional ~55/45 split giving the form the wider
            column. Grid's default align-items: stretch is what makes both
            cards equal height, which is what lets the preview's footer link
            line up with the bottom of the form card across the gap.
          */}
          <div className="mt-[var(--card-gap)] grid gap-[var(--card-gap)] min-[800px]:grid-cols-[1.1fr_1fr]">
            <section className="card p-5">
              <p className="eyebrow font-bold">What did you spend?</p>

              <form onSubmit={handleAddExpense} className="mt-4 space-y-3 text-left">
                <div>
                  <label htmlFor="description" className="sr-only">
                    Description
                  </label>
                  <input
                    id="description"
                    type="text"
                    placeholder="Description"
                    value={description}
                    onChange={(e) => {
                      setDescription(e.target.value);
                      setExpenseError("");
                    }}
                    required
                    className={inputClasses}
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="amount" className="sr-only">
                      Amount
                    </label>
                    <input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      placeholder="Amount"
                      value={amount}
                      onChange={(e) => {
                        setAmount(e.target.value);
                        setExpenseError("");
                      }}
                      required
                      className={`${inputClasses} font-mono tabular-nums`}
                    />
                  </div>

                  <div className="flex-1">
                    <label htmlFor="category" className="sr-only">
                      Category
                    </label>
                    <select
                      id="category"
                      value={categoryId}
                      onChange={(e) => {
                        setCategoryId(e.target.value);
                        setExpenseError("");
                      }}
                      required
                      className={inputClasses}
                    >
                      <option value="" disabled>
                        Category
                      </option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="text-[13px]">
                  <button
                    type="button"
                    onClick={() => setManagingCategories(true)}
                    className={`${linkButtonClasses} text-dim`}
                  >
                    + New category
                  </button>
                </div>

                <div>
                  <label htmlFor="expenseDate" className="sr-only">
                    Date
                  </label>
                  <input
                    id="expenseDate"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => {
                      setExpenseDate(e.target.value);
                      setExpenseError("");
                    }}
                    required
                    className={`${inputClasses} date-input`}
                  />
                </div>

                {expenseError && (
                  <p role="alert" className="text-sm text-danger">
                    {expenseError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting || categories.length === 0}
                  className={`${primaryButtonBoldClasses} btn-press`}
                >
                  {submitting ? "Adding…" : "Add entry"}
                </button>
              </form>
            </section>

            <LedgerPreview
              monthLabel={monthLabel}
              expenses={recentExpenses}
              categoryIconById={categoryIconById}
              onOpenLedger={handleOpenLedger}
            />
          </div>
        </main>
      )}

      <CategoryManager
        open={managingCategories}
        onClose={() => setManagingCategories(false)}
        token={token}
        onLogout={onLogout}
        onCategoriesChanged={loadAll}
      />
    </div>
  );
}

export default Home;
