import { useEffect, useState } from "react";
import type { Category, Expense } from "./types";
import Login from "./Login";
import { authFetch, extractErrorMessage } from "./api";

function App() {
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("token")
  );

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [slowLoading, setSlowLoading] = useState(false);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryName, setCategoryName] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expenseError, setExpenseError] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState("");

  function handleLogin(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  async function loadExpenses(authToken: string) {
    setLoading(true);
    setSlowLoading(false);
    // Our Render free-tier backend sleeps after inactivity, so the very
    // first request after a while can take 30-60s to wake it up. If we're
    // still loading 5s in, assume that's what's happening and say so.
    const slowLoadingTimer = setTimeout(() => setSlowLoading(true), 5000);

    try {
      const response = await authFetch(authToken, "/api/expenses", handleLogout);
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      const data: Expense[] = await response.json();
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load expenses.");
    } finally {
      clearTimeout(slowLoadingTimer);
      setSlowLoading(false);
      setLoading(false);
    }
  }

  async function loadCategories(authToken: string) {
    try {
      const response = await authFetch(authToken, "/api/categories", handleLogout);
      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
      const data: Category[] = await response.json();
      setCategories(data);
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  }

  useEffect(() => {
    if (!token) return;

    loadExpenses(token);
    loadCategories(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    setExpenseError("");

    try {
      const response = await authFetch(token, "/api/expenses", handleLogout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          description,
          expenseDate,
          categoryId: parseInt(categoryId, 10),
        }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      setDescription("");
      setAmount("");
      setExpenseDate("");
      setCategoryId("");
      loadExpenses(token);
    } catch (err) {
      setExpenseError(
        err instanceof Error ? err.message : "Failed to create expense."
      );
    }
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!token) return;

    const trimmedName = categoryName.trim();
    if (!trimmedName) {
      setCategoryError("Category name can't be empty.");
      return;
    }

    setCategoryError("");
    setAddingCategory(true);

    try {
      const response = await authFetch(token, "/api/categories", handleLogout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmedName }),
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      setCategoryName("");
      loadCategories(token);
    } catch (err) {
      setCategoryError(
        err instanceof Error ? err.message : "Failed to create category."
      );
    } finally {
      setAddingCategory(false);
    }
  }

  async function handleDeleteExpense(id: number) {
    if (!token) return;
    if (!window.confirm("Delete this expense?")) return;

    setDeleteError("");
    setDeletingId(id);

    try {
      const response = await authFetch(
        token,
        `/api/expenses/${id}`,
        handleLogout,
        { method: "DELETE" }
      );

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      // A 204 response has no body, so there's nothing to parse here —
      // calling response.json() on an empty body would throw. We just
      // refetch the list so the deleted row disappears.
      loadExpenses(token);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete expense."
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses</h1>
        <button
          onClick={handleLogout}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Log out
        </button>
      </div>

      <form
        onSubmit={handleAddCategory}
        className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3"
      >
        <h2 className="text-lg font-semibold text-gray-900">Add a category</h2>

        <input
          type="text"
          placeholder="Category name"
          value={categoryName}
          onChange={(e) => {
            setCategoryName(e.target.value);
            setCategoryError("");
          }}
          className="w-full rounded border border-gray-300 p-2"
        />

        {categoryError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {categoryError}
          </p>
        )}

        <button
          type="submit"
          disabled={addingCategory}
          className="w-full rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {addingCategory ? "Adding..." : "Add category"}
        </button>
      </form>

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3"
      >
        <h2 className="text-lg font-semibold text-gray-900">Add an expense</h2>

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setExpenseError("");
          }}
          required
          className="w-full rounded border border-gray-300 p-2"
        />

        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            setExpenseError("");
          }}
          required
          className="w-full rounded border border-gray-300 p-2"
        />

        <input
          type="date"
          value={expenseDate}
          onChange={(e) => {
            setExpenseDate(e.target.value);
            setExpenseError("");
          }}
          required
          className="w-full rounded border border-gray-300 p-2"
        />

        <select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setExpenseError("");
          }}
          required
          className="w-full rounded border border-gray-300 p-2"
        >
          <option value="" disabled>
            Select a category
          </option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>

        {categories.length === 0 && (
          <p className="rounded border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-800">
            You don't have any categories yet. Add one above before creating
            an expense.
          </p>
        )}

        {expenseError && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {expenseError}
          </p>
        )}

        <button
          type="submit"
          disabled={categories.length === 0}
          className="w-full rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          Add expense
        </button>
      </form>

      {deleteError && (
        <p className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {deleteError}
        </p>
      )}

      {loading ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <svg
              className="h-4 w-4 animate-spin text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span>Loading expenses...</span>
          </div>

          {slowLoading && (
            <p className="rounded border border-yellow-200 bg-yellow-50 p-2 text-sm text-yellow-800">
              This is taking longer than usual. Our backend is hosted on a
              free tier that falls asleep after inactivity, so the first
              request can take up to a minute while it wakes back up. Thanks
              for your patience!
            </p>
          )}
        </div>
      ) : error ? (
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-blue-900">
          <p className="font-medium">Live UI demo</p>
          <p className="mt-1 text-sm text-blue-800">
            The backend API runs locally, so live data isn't available here.
            See the{" "}
            <a
              href="https://github.com/roberttanjr19/expense-tracker-frontend"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-900"
            >
              GitHub repo
            </a>{" "}
            for the full working app and screenshots.
          </p>
        </div>
      ) : expenses.length === 0 ? (
        <p className="text-gray-600">No expenses yet.</p>
      ) : (
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex justify-between items-center rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div>
                <p className="font-medium text-gray-900">
                  {expense.description}
                </p>
                <p className="text-sm text-gray-500">
                  {expense.category.name} &middot; {expense.expenseDate}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-semibold text-gray-900">
                  ${expense.amount.toFixed(2)}
                </p>
                <button
                  type="button"
                  onClick={() => handleDeleteExpense(expense.id)}
                  disabled={deletingId === expense.id}
                  className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 disabled:no-underline"
                >
                  {deletingId === expense.id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
