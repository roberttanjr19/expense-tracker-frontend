import { useState } from "react";
import type { Income } from "./types";
import { authFetch, extractErrorMessage } from "./api";
import { formatMoney } from "./money";
import { monthName } from "./date";
import { inputClasses, primaryButtonBoldClasses } from "./formStyles";
import { useMonthlyIncome } from "./useMonthlyIncome";
import IncomeRow, { type IncomeDraft } from "./IncomeRow";

interface IncomeSectionProps {
  token: string;
  onLogout: () => void;
  year: number;
  month: number;
}

const emptyDraft: IncomeDraft = {
  source: "",
  amount: "",
  incomeDate: "",
  description: "",
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * "Income": log what came in this month, and manage what's already there.
 *
 * One-time entries only — recurring income is a later step, so nothing here
 * carries a schedule. Owns all four calls (POST/GET/PUT/DELETE) and delegates
 * the month's data to useMonthlyIncome, refetching after every mutation so the
 * list and the header total can never drift apart.
 */
function IncomeSection({ token, onLogout, year, month }: IncomeSectionProps) {
  const label = monthName(year, month);
  const { income, total, loading, error, refetch } = useMonthlyIncome(
    token,
    year,
    month,
    onLogout
  );

  const [source, setSource] = useState("");
  const [amount, setAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(() => toIsoDate(new Date()));
  const [description, setDescription] = useState("");
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<IncomeDraft>(emptyDraft);
  const [editError, setEditError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const trimmedSource = source.trim();
    if (!trimmedSource) {
      setAddError("Source can't be blank.");
      return;
    }

    setAddError("");
    setAdding(true);

    try {
      const response = await authFetch(token, "/api/income", onLogout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          source: trimmedSource,
          description: description.trim() || undefined,
          incomeDate,
        }),
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response));

      setSource("");
      setAmount("");
      setDescription("");
      setIncomeDate(toIsoDate(new Date()));
      await refetch();
    } catch (err) {
      setAddError(
        err instanceof Error ? err.message : "Couldn't add that income. Please try again."
      );
    } finally {
      setAdding(false);
    }
  }

  function startEdit(entry: Income) {
    setEditError("");
    setEditingId(entry.id);
    setEditDraft({
      source: entry.source,
      amount: String(entry.amount),
      incomeDate: entry.incomeDate,
      description: entry.description ?? "",
    });
  }

  function cancelEdit() {
    setEditError("");
    setEditingId(null);
    setEditDraft(emptyDraft);
  }

  async function handleSave(id: number) {
    const trimmedSource = editDraft.source.trim();
    if (!trimmedSource) {
      setEditError("Source can't be blank.");
      return;
    }

    setEditError("");
    setSavingId(id);

    try {
      const response = await authFetch(token, `/api/income/${id}`, onLogout, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(editDraft.amount),
          source: trimmedSource,
          // Omitted rather than sent as "" when cleared, so the backend stores
          // an absent description instead of an empty string.
          description: editDraft.description.trim() || undefined,
          incomeDate: editDraft.incomeDate,
        }),
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response));

      cancelEdit();
      await refetch();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Couldn't save that change. Please try again."
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this income entry?")) return;

    setEditError("");
    setDeletingId(id);

    try {
      const response = await authFetch(token, `/api/income/${id}`, onLogout, {
        method: "DELETE",
      });
      // A 204 has no body, so there's nothing to parse on success.
      if (!response.ok) throw new Error(await extractErrorMessage(response));

      if (editingId === id) cancelEdit();
      await refetch();
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Couldn't delete that entry. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <section className="border-b border-rule py-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Income</p>
        <p className="eyebrow whitespace-nowrap text-accent">
          {label} &middot;{" "}
          <span className="font-mono normal-case tracking-normal tabular-nums">
            {formatMoney(total)}
          </span>
        </p>
      </div>

      <form onSubmit={handleAdd} className="mt-4 space-y-3">
        {/* Single column at 320px; pairs up once there's room for two fields. */}
        <div className="grid gap-3 min-[520px]:grid-cols-2">
          <div>
            <label htmlFor="income-source" className="sr-only">
              Source
            </label>
            <input
              id="income-source"
              type="text"
              placeholder="Source (e.g. Salary)"
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setAddError("");
              }}
              required
              className={inputClasses}
            />
          </div>

          <div>
            <label htmlFor="income-amount" className="sr-only">
              Amount
            </label>
            <input
              id="income-amount"
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              placeholder="Amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setAddError("");
              }}
              required
              className={`${inputClasses} font-mono tabular-nums`}
            />
          </div>

          <div>
            <label htmlFor="income-date" className="sr-only">
              Date
            </label>
            <input
              id="income-date"
              type="date"
              value={incomeDate}
              onChange={(e) => {
                setIncomeDate(e.target.value);
                setAddError("");
              }}
              required
              className={`${inputClasses} date-input`}
            />
          </div>

          <div>
            <label htmlFor="income-description" className="sr-only">
              Description (optional)
            </label>
            <input
              id="income-description"
              type="text"
              placeholder="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClasses}
            />
          </div>
        </div>

        {addError && (
          <p role="alert" className="text-[13px] text-danger">
            {addError}
          </p>
        )}

        <button
          type="submit"
          disabled={adding}
          className={`${primaryButtonBoldClasses} btn-press min-[520px]:w-auto min-[520px]:px-5`}
        >
          {adding ? "Adding…" : "Add income"}
        </button>
      </form>

      {/* Only the delete case surfaces here. While a row is open for editing it
          renders this same message inline instead, so gating on editingId
          prevents the error appearing twice. */}
      {editError && editingId === null && (
        <p role="alert" className="mt-4 text-[13px] text-danger">
          {editError}
        </p>
      )}

      {error ? (
        <p role="alert" className="mt-4 text-[15px] text-danger">
          {error}
        </p>
      ) : loading ? (
        <p className="mt-4 text-[15px] text-dim">Loading income&hellip;</p>
      ) : income.length === 0 ? (
        <div className="mt-4 rounded-[10px] border-[0.5px] border-rule bg-paper px-4 py-6 text-center">
          <p className="text-[15px] text-dim">No income recorded for {label}.</p>
          <p className="mt-1 text-[13px] text-dim">
            Add your first entry above to see your net for the month.
          </p>
        </div>
      ) : (
        // overflow-hidden so the banded rows are clipped by the panel's radius
        // instead of squaring off its top and bottom corners.
        <ul className="mt-4 divide-y divide-rule overflow-hidden rounded-[10px] border-[0.5px] border-rule bg-paper">
          {income.map((entry, index) => (
            <IncomeRow
              key={entry.id}
              entry={entry}
              banded={index % 2 === 0}
              isEditing={editingId === entry.id}
              saving={savingId === entry.id}
              deleting={deletingId === entry.id}
              editError={editingId === entry.id ? editError : ""}
              editDraft={editDraft}
              onDraftChange={(patch) =>
                setEditDraft((current) => ({ ...current, ...patch }))
              }
              onStartEdit={() => startEdit(entry)}
              onCancelEdit={cancelEdit}
              onSaveEdit={() => handleSave(entry.id)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

export default IncomeSection;
