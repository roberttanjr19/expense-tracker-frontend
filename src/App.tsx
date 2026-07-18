import { useEffect, useState } from "react";
import type { Category, Expense } from "./types";

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [categories, setCategories] = useState<Category[]>([]);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState("");
  const [categoryId, setCategoryId] = useState("");

  function loadExpenses() {
    setLoading(true);
    fetch("http://localhost:8080/api/expenses")
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        return response.json();
      })
      .then((data: Expense[]) => {
        setExpenses(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadExpenses();

    fetch("http://localhost:8080/api/categories")
      .then((response) => response.json())
      .then((data: Category[]) => setCategories(data))
      .catch((err: Error) => console.error("Failed to load categories:", err));
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    fetch("http://localhost:8080/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: parseFloat(amount),
        description,
        expenseDate,
        userId: 1,
        categoryId: parseInt(categoryId, 10),
      }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }
        setDescription("");
        setAmount("");
        setExpenseDate("");
        setCategoryId("");
        loadExpenses();
      })
      .catch(() => {
        alert("Failed to create expense. Please try again.");
      });
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Expenses</h1>

      <form
        onSubmit={handleSubmit}
        className="mb-8 rounded-lg border border-gray-200 bg-white p-4 shadow-sm space-y-3"
      >
        <h2 className="text-lg font-semibold text-gray-900">Add an expense</h2>

        <input
          type="text"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="w-full rounded border border-gray-300 p-2"
        />

        <input
          type="number"
          step="0.01"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
          className="w-full rounded border border-gray-300 p-2"
        />

        <input
          type="date"
          value={expenseDate}
          onChange={(e) => setExpenseDate(e.target.value)}
          required
          className="w-full rounded border border-gray-300 p-2"
        />

        <select
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
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

        <button
          type="submit"
          className="w-full rounded bg-blue-600 p-2 font-medium text-white hover:bg-blue-700"
        >
          Add expense
        </button>
      </form>

      {loading ? (
        <p className="text-gray-600">Loading expenses...</p>
      ) : error ? (
        <p className="text-red-600">Error: {error}</p>
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
              <p className="text-lg font-semibold text-gray-900">
                ${expense.amount.toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
