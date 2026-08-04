import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import type { Category, Expense } from "./types";
import { authFetch, extractErrorMessage } from "./api";
import { monthName } from "./date";
import { linkButtonClasses } from "./formStyles";
import HeaderMenu from "./HeaderMenu";
import ThemeToggle from "./ThemeToggle";
import PeriodStepper from "./PeriodStepper";
import LedgerTable from "./LedgerTable";
import type { ExpenseDraft } from "./LedgerRow";
import Breakdown from "./Breakdown";
import type { CategoryTotal } from "./Breakdown";

interface LedgerProps {
  token: string;
  onLogout: () => void;
}

const emptyDraft: ExpenseDraft = { amount: "", description: "", expenseDate: "", categoryId: "" };

function Ledger({ token, onLogout }: LedgerProps) {
  const navigate = useNavigate();
  const params = useParams<{ year: string; month: string }>();

  // Fixed at mount, same reasoning as Home: "today" shouldn't shift under
  // the user while they're paging around the ledger.
  const [today] = useState(() => new Date());
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;

  const yearParam = Number(params.year);
  const monthParam = Number(params.month);
  const isValidPeriod =
    Number.isInteger(yearParam) && Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12;

  const year = isValidPeriod ? yearParam : todayYear;
  const month = isValidPeriod ? monthParam : todayMonth;
  const monthLabel = monthName(year, month);

  useEffect(() => {
    if (!isValidPeriod) {
      navigate(`/ledger/${todayYear}/${todayMonth}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidPeriod]);

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<ExpenseDraft>(emptyDraft);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadMonth() {
    setLoading(true);
    setSlowLoading(false);
    setLoadError("");
    // Same Render free-tier cold start as Home: assume that's what's
    // happening if the request is still pending past ~3s.
    const slowTimer = setTimeout(() => setSlowLoading(true), 3000);

    try {
      const [expensesRes, categoriesRes] = await Promise.all([
        authFetch(token, `/api/expenses?year=${year}&month=${month}`, onLogout),
        authFetch(token, "/api/categories", onLogout),
      ]);

      if (!expensesRes.ok) throw new Error(await extractErrorMessage(expensesRes));
      if (!categoriesRes.ok) throw new Error(await extractErrorMessage(categoriesRes));

      setExpenses(await expensesRes.json());
      setCategories(await categoriesRes.json());
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Couldn't load this month. Please try again."
      );
    } finally {
      clearTimeout(slowTimer);
      setSlowLoading(false);
      setLoading(false);
    }
  }

  useEffect(() => {
    if (isValidPeriod) loadMonth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month, isValidPeriod]);

  function startEdit(expense: Expense) {
    setEditingId(expense.id);
    setEditDraft({
      amount: String(expense.amount),
      description: expense.description,
      expenseDate: expense.expenseDate,
      categoryId: String(expense.category.id),
    });
    setEditError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setEditError("");
  }

  function updateDraft(patch: Partial<ExpenseDraft>) {
    setEditDraft((current) => ({ ...current, ...patch }));
  }

  async function saveEdit() {
    if (editingId === null) return;
    setSaving(true);
    setEditError("");

    try {
      const response = await authFetch(token, `/api/expenses/${editingId}`, onLogout, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(editDraft.amount),
          description: editDraft.description,
          expenseDate: editDraft.expenseDate,
          categoryId: parseInt(editDraft.categoryId, 10),
        }),
      });

      if (!response.ok) throw new Error(await extractErrorMessage(response));

      setEditingId(null);
      await loadMonth();
    } catch (err) {
      // Deliberately don't touch editDraft here, so the values the user
      // typed are still there to fix and resubmit.
      setEditError(
        err instanceof Error ? err.message : "Couldn't save that change. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteExpense(id: number) {
    if (!window.confirm("Delete this entry?")) return;

    setDeletingId(id);
    setActionError("");

    try {
      const response = await authFetch(token, `/api/expenses/${id}`, onLogout, {
        method: "DELETE",
      });
      // A 204 has no body, so there's nothing to parse on success.
      if (!response.ok) throw new Error(await extractErrorMessage(response));

      if (editingId === id) cancelEdit();
      await loadMonth();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Couldn't delete that entry. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  const isAtOrAfterCurrentMonth =
    year > todayYear || (year === todayYear && month >= todayMonth);

  function goToPrevMonth() {
    const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
    navigate(`/ledger/${prev.year}/${prev.month}`);
  }

  function goToNextMonth() {
    if (isAtOrAfterCurrentMonth) return;
    const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
    navigate(`/ledger/${next.year}/${next.month}`);
  }

  const categoryTotals = useMemo<CategoryTotal[]>(() => {
    const totals = new Map<number, CategoryTotal>();
    for (const expense of expenses) {
      const existing = totals.get(expense.category.id);
      if (existing) {
        existing.total += expense.amount;
      } else {
        totals.set(expense.category.id, {
          id: expense.category.id,
          name: expense.category.name,
          icon: expense.category.icon,
          total: expense.amount,
        });
      }
    }
    return [...totals.values()].sort((a, b) => b.total - a.total);
  }, [expenses]);

  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b border-rule">
        <div className="mx-auto flex w-full max-w-[640px] shrink-0 items-center justify-between px-4 py-4 sm:px-6 sm:py-5 min-[900px]:max-w-[1100px] min-[900px]:px-8">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Back to home"
              onClick={() => navigate("/")}
              className="flex h-10 w-10 items-center justify-center rounded text-ink hover:bg-band focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
            >
              <ArrowLeft size={18} aria-hidden="true" />
            </button>
            <PeriodStepper
              monthLabel={monthLabel}
              year={year}
              nextDisabled={isAtOrAfterCurrentMonth}
              onPrev={goToPrevMonth}
              onNext={goToNextMonth}
            />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <HeaderMenu onSignOut={onLogout} />
          </div>
        </div>
      </header>

      {loading ? (
        <div className="flex min-h-[calc(100dvh-80px)] flex-col items-center justify-center gap-2 px-4 text-center">
          <p className="text-[15px] text-dim">Loading&hellip;</p>
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
        <main className="mx-auto w-full max-w-[640px] flex-1 px-4 py-8 sm:px-6 min-[900px]:max-w-[1100px] min-[900px]:px-8">
          {actionError && (
            <p role="alert" className="mb-4 text-[15px] text-danger">
              {actionError}
            </p>
          )}

          {expenses.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-16 text-center">
              <p className="text-[15px] text-dim">No entries for {monthLabel}.</p>
              <button
                type="button"
                onClick={() => navigate("/")}
                className={`${linkButtonClasses} text-[15px]`}
              >
                Add one from the home screen &rarr;
              </button>
            </div>
          ) : (
            <>
              <LedgerTable
                expenses={expenses}
                categories={categories}
                monthLabel={monthLabel}
                editingId={editingId}
                editDraft={editDraft}
                saving={saving}
                editError={editError}
                deletingId={deletingId}
                onStartEdit={startEdit}
                onCancelEdit={cancelEdit}
                onDraftChange={updateDraft}
                onSaveEdit={saveEdit}
                onDelete={deleteExpense}
              />
              <Breakdown totals={categoryTotals} />
            </>
          )}
        </main>
      )}
    </div>
  );
}

export default Ledger;
