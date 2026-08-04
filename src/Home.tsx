import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Category, Expense, MonthSummary } from "./types";
import { authFetch, extractErrorMessage } from "./api";
import { formatMoney, formatSignedMoney } from "./money";
import { inputClasses, linkButtonClasses, primaryButtonClasses } from "./formStyles";
import HeaderMenu from "./HeaderMenu";
import SummaryStrip from "./SummaryStrip";
import LedgerPreview from "./LedgerPreview";
import PreviousMonths from "./PreviousMonths";

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
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const monthLabel = useMemo(
    () => today.toLocaleString("en-CA", { month: "long" }),
    [today]
  );

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [monthSummaries, setMonthSummaries] = useState<MonthSummary[]>([]);

  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(() => toIsoDate(today));
  const [categoryId, setCategoryId] = useState("");
  const [expenseError, setExpenseError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showAddCategory, setShowAddCategory] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  async function loadAll() {
    setLoading(true);
    setSlowLoading(false);
    setLoadError("");
    // Render's free tier sleeps after inactivity, so the first request after
    // a while can take up to a minute. If we're still waiting past ~3s,
    // assume that's what's happening and say so.
    const slowTimer = setTimeout(() => setSlowLoading(true), 3000);

    try {
      const [expensesRes, categoriesRes, summaryRes] = await Promise.all([
        authFetch(token, `/api/expenses?year=${year}&month=${month}`, onLogout),
        authFetch(token, "/api/categories", onLogout),
        authFetch(token, "/api/expenses/summary/months", onLogout),
      ]);

      if (!expensesRes.ok) throw new Error(await extractErrorMessage(expensesRes));
      if (!categoriesRes.ok) throw new Error(await extractErrorMessage(categoriesRes));
      if (!summaryRes.ok) throw new Error(await extractErrorMessage(summaryRes));

      setExpenses(await expensesRes.json());
      setCategories(await categoriesRes.json());
      setMonthSummaries(await summaryRes.json());
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
  }, []);

  async function refetchExpensesAndSummary() {
    const [expensesRes, summaryRes] = await Promise.all([
      authFetch(token, `/api/expenses?year=${year}&month=${month}`, onLogout),
      authFetch(token, "/api/expenses/summary/months", onLogout),
    ]);
    if (expensesRes.ok) setExpenses(await expensesRes.json());
    if (summaryRes.ok) setMonthSummaries(await summaryRes.json());
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
      await refetchExpensesAndSummary();
    } catch (err) {
      setExpenseError(
        err instanceof Error ? err.message : "Couldn't add that entry. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAddCategory() {
    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      setCategoryError("Category name can't be empty.");
      return;
    }

    setCategoryError("");
    setAddingCategory(true);

    try {
      const response = await authFetch(token, "/api/categories", onLogout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) throw new Error(await extractErrorMessage(response));

      setCategoryName("");
      setShowAddCategory(false);

      const categoriesRes = await authFetch(token, "/api/categories", onLogout);
      if (categoriesRes.ok) setCategories(await categoriesRes.json());
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : "Couldn't add that category. Please try again."
      );
    } finally {
      setAddingCategory(false);
    }
  }

  function handleOpenLedger() {
    navigate(`/ledger/${year}/${month}`);
  }

  function handleOpenMonth(year: number, month: number) {
    navigate(`/ledger/${year}/${month}`);
  }

  const monthTotal = useMemo(
    () => expenses.reduce((sum, e) => sum + e.amount, 0),
    [expenses]
  );

  const previousMonthDate = useMemo(
    () => (month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 }),
    [year, month]
  );
  const previousMonthName = useMemo(
    () =>
      new Date(previousMonthDate.year, previousMonthDate.month - 1, 1).toLocaleString("en-CA", {
        month: "long",
      }),
    [previousMonthDate]
  );
  const previousSummary = monthSummaries.find(
    (s) => s.year === previousMonthDate.year && s.month === previousMonthDate.month
  );
  const vsPreviousLabel = previousSummary
    ? formatSignedMoney(monthTotal - previousSummary.total)
    : "—";

  const recentExpenses = useMemo(() => [...expenses].slice(-4).reverse(), [expenses]);

  const categoryIconById = useMemo(
    () => new Map(categories.map((c) => [c.id, c.icon])),
    [categories]
  );

  const otherMonths = monthSummaries.filter((s) => !(s.year === year && s.month === month));
  const visibleMonths = otherMonths.slice(0, 4);
  const hasMoreMonths = otherMonths.length > 4;
  const allTimeTotal = monthSummaries.reduce((sum, s) => sum + s.total, 0);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b border-rule">
        <div className="mx-auto flex w-full max-w-[640px] shrink-0 items-center justify-between px-4 py-4 sm:px-6 sm:py-5 min-[900px]:max-w-[1100px] min-[900px]:px-8">
          <div>
            <span className="text-[16px] font-medium">Daybook</span>
            <p className="eyebrow mt-0.5">
              {monthLabel} {year}
            </p>
          </div>
          <HeaderMenu onSignOut={onLogout} />
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-[15px] text-dim">Loading your ledger&hellip;</p>
          {slowLoading && (
            <p className="max-w-xs text-sm text-dim">
              Waking the server up &mdash; this takes up to a minute on first load.
            </p>
          )}
        </div>
      ) : loadError ? (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center px-4 text-center">
          <p className="text-[15px] text-danger">{loadError}</p>
        </div>
      ) : (
        <main className="mx-auto flex w-full max-w-[640px] flex-1 flex-col px-4 sm:px-6 min-[900px]:max-w-[1100px] min-[900px]:px-8">
          <SummaryStrip
            spentLabel={formatMoney(monthTotal)}
            previousMonthName={previousMonthName}
            vsPreviousLabel={vsPreviousLabel}
            entryCount={expenses.length}
          />

          <div className="space-y-8 py-8 min-[900px]:grid min-[900px]:grid-cols-[42%_1fr] min-[900px]:gap-x-10 min-[900px]:space-y-0">
            <section>
              <p className="eyebrow">What did you spend?</p>

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
                  {!showAddCategory ? (
                    <button
                      type="button"
                      onClick={() => setShowAddCategory(true)}
                      className={`${linkButtonClasses} text-dim`}
                    >
                      + New category
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <label htmlFor="categoryName" className="sr-only">
                        Category name
                      </label>
                      <input
                        id="categoryName"
                        type="text"
                        placeholder="Category name"
                        value={categoryName}
                        onChange={(e) => {
                          setCategoryName(e.target.value);
                          setCategoryError("");
                        }}
                        onKeyDown={(e) => {
                          // This input lives inside the outer add-expense
                          // <form>, so an unhandled Enter would implicitly
                          // submit THAT form (a nested <form> here would be
                          // invalid HTML). Intercept it and run the
                          // category-add logic directly instead.
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCategory();
                          }
                        }}
                        className={`${inputClasses} h-9 text-[14px]`}
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        disabled={addingCategory}
                        className="h-9 shrink-0 rounded border border-rule px-3 text-[13px] text-ink hover:bg-band disabled:opacity-50 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                      >
                        {addingCategory ? "Adding…" : "Add"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddCategory(false);
                          setCategoryName("");
                          setCategoryError("");
                        }}
                        className={`${linkButtonClasses} text-dim`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {categoryError && (
                    <p role="alert" className="mt-1 text-danger">
                      {categoryError}
                    </p>
                  )}
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
                    className={inputClasses}
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
                  className={primaryButtonClasses}
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

          <PreviousMonths
            months={visibleMonths}
            hasMore={hasMoreMonths}
            allTimeTotal={allTimeTotal}
            onOpenMonth={handleOpenMonth}
          />
        </main>
      )}
    </div>
  );
}

export default Home;
