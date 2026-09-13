import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import type { Category } from "./types";
import { authFetch, extractErrorMessage } from "./api";
import { formatMoney } from "./money";
import { resolveCategoryIcon } from "./icons";
import { DEFAULT_CATEGORY_ICON } from "./categoryIcons";
import IconPicker from "./IconPicker";
import { inputClasses, primaryButtonClasses } from "./formStyles";

interface CategoryManagerProps {
  open: boolean;
  onClose: () => void;
  token: string;
  onLogout: () => void;
  /** Lets whichever page opened the menu refetch its own category list once this panel changes something. */
  onCategoriesChanged?: () => void;
}

const cellInputClasses =
  "h-9 w-full rounded border border-rule bg-paper px-2 text-[14px] text-ink " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const iconButtonClasses =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded text-dim hover:bg-band hover:text-ink disabled:pointer-events-none disabled:opacity-50 " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

const cancelButtonClasses =
  "h-9 flex-1 rounded border border-rule text-[14px] text-ink hover:bg-band disabled:opacity-50 " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** Parses a budget input string into { value, error }. Empty string means "no budget" (null), not an error. */
function parseBudgetInput(raw: string): { value: number | null; error: string } {
  const trimmed = raw.trim();
  if (trimmed === "") return { value: null, error: "" };

  const parsed = Number(trimmed);
  if (Number.isNaN(parsed) || parsed < 0) {
    return { value: null, error: "Budget must be a number 0 or greater." };
  }
  return { value: parsed, error: "" };
}

/**
 * Overlay panel for renaming categories, setting/clearing their monthly
 * budget, deleting them, and adding new ones. Refetches from the server
 * after every mutation rather than patching local state optimistically, so
 * the list can never drift from what the backend actually has.
 */
function CategoryManager({ open, onClose, token, onLogout, onCategoriesChanged }: CategoryManagerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editingId, setEditingId] = useState<number | null>(null);
  const [draftName, setDraftName] = useState("");
  const [draftBudget, setDraftBudget] = useState("");
  const [draftIcon, setDraftIcon] = useState(DEFAULT_CATEGORY_ICON);
  const [rowError, setRowError] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [newName, setNewName] = useState("");
  const [newBudget, setNewBudget] = useState("");
  const [newIcon, setNewIcon] = useState(DEFAULT_CATEGORY_ICON);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);

  async function loadCategories() {
    setLoading(true);
    setLoadError("");
    try {
      const response = await authFetch(token, "/api/categories", onLogout);
      if (!response.ok) throw new Error(await extractErrorMessage(response));
      setCategories(await response.json());
    } catch (err) {
      setLoadError(
        err instanceof Error ? err.message : "Couldn't load categories. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  // Reset every bit of transient UI state and refetch each time the panel
  // opens, so it never shows a stale edit form or error from a previous visit.
  useEffect(() => {
    if (!open) return;
    setEditingId(null);
    setRowError("");
    setNewName("");
    setNewBudget("");
    setNewIcon(DEFAULT_CATEGORY_ICON);
    setAddError("");
    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  function startEdit(category: Category) {
    setEditingId(category.id);
    setDraftName(category.name);
    setDraftBudget(category.monthlyBudget != null ? String(category.monthlyBudget) : "");
    // Categories saved before the picker existed have no icon; the neutral
    // default stands in so the picker always has a valid selection.
    setDraftIcon(category.icon ?? DEFAULT_CATEGORY_ICON);
    setRowError("");
  }

  function cancelEdit() {
    setEditingId(null);
    setRowError("");
  }

  async function afterMutation() {
    await loadCategories();
    onCategoriesChanged?.();
  }

  async function saveEdit(category: Category) {
    const trimmedName = draftName.trim();
    if (!trimmedName) {
      setRowError("Category name can't be empty.");
      return;
    }
    const { value: monthlyBudget, error: budgetError } = parseBudgetInput(draftBudget);
    if (budgetError) {
      setRowError(budgetError);
      return;
    }

    setRowError("");
    setSavingId(category.id);
    try {
      const response = await authFetch(token, `/api/categories/${category.id}`, onLogout, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        // draftIcon rather than category.icon: this used to pass the stored
        // icon straight back so an edit wouldn't wipe it. Now the picker owns
        // it, seeded from category.icon in startEdit.
        body: JSON.stringify({ name: trimmedName, icon: draftIcon, monthlyBudget }),
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response));

      setEditingId(null);
      await afterMutation();
    } catch (err) {
      setRowError(err instanceof Error ? err.message : "Couldn't save that change. Please try again.");
    } finally {
      setSavingId(null);
    }
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Delete "${category.name}"?`)) return;

    setRowError("");
    setDeletingId(category.id);
    try {
      const response = await authFetch(token, `/api/categories/${category.id}`, onLogout, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response));

      if (editingId === category.id) setEditingId(null);
      await afterMutation();
    } catch (err) {
      // Deliberately don't crash on the backend's 400 ("still has expenses")
      // — just surface it in place, same as every other delete flow here.
      setEditingId(category.id);
      setDraftName(category.name);
      setDraftBudget(category.monthlyBudget != null ? String(category.monthlyBudget) : "");
      setDraftIcon(category.icon ?? DEFAULT_CATEGORY_ICON);
      setRowError(
        err instanceof Error ? err.message : "Couldn't delete that category. Please try again."
      );
    } finally {
      setDeletingId(null);
    }
  }

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    const trimmedName = newName.trim();
    if (!trimmedName) {
      setAddError("Category name can't be empty.");
      return;
    }
    const { value: monthlyBudget, error: budgetError } = parseBudgetInput(newBudget);
    if (budgetError) {
      setAddError(budgetError);
      return;
    }

    setAddError("");
    setAdding(true);
    try {
      const response = await authFetch(token, "/api/categories", onLogout, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // `icon` is new here — create previously sent no icon at all, so every
        // category started on the Circle fallback.
        body: JSON.stringify({ name: trimmedName, icon: newIcon, monthlyBudget }),
      });
      if (!response.ok) throw new Error(await extractErrorMessage(response));

      setNewName("");
      setNewBudget("");
      setNewIcon(DEFAULT_CATEGORY_ICON);
      await afterMutation();
    } catch (err) {
      setAddError(err instanceof Error ? err.message : "Couldn't add that category. Please try again.");
    } finally {
      setAdding(false);
    }
  }

  // One editing context at a time: while a row's inline edit form is open,
  // the add-new form is hidden. editingId already answers "is a row being
  // edited" (it holds that row's id, or null), so no new state is needed —
  // and because it's the same flag the row forms key off, the two can't
  // disagree about which mode the panel is in.
  const isEditingRow = editingId !== null;

  return (
    <div
      className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8 sm:items-center"
      onMouseDown={onClose}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-manager-title"
        tabIndex={-1}
        onMouseDown={(e) => e.stopPropagation()}
        className="w-full max-w-[480px] rounded border border-rule bg-paper shadow-lg focus:outline-none"
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-4">
          <h2 id="category-manager-title" className="text-[16px] font-semibold">
            Manage categories
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className={iconButtonClasses}>
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {loading ? (
            <p className="px-5 py-6 text-[14px] text-dim">Loading&hellip;</p>
          ) : loadError ? (
            <p className="px-5 py-6 text-[14px] text-danger">{loadError}</p>
          ) : categories.length === 0 ? (
            <p className="px-5 py-6 text-[14px] text-dim">No categories yet &mdash; add one below.</p>
          ) : (
            categories.map((category, index) => {
              const CategoryIcon = resolveCategoryIcon(category.icon);
              const banded = index % 2 === 0;
              const isEditing = editingId === category.id;
              const busy = savingId === category.id || deletingId === category.id;

              // Only needed while editing, and resolved inside the map
              // callback (not at the component's top level) for the same
              // reason the other dynamic icons in this app are.
              const DraftIcon = resolveCategoryIcon(draftIcon);

              if (isEditing) {
                return (
                  <form
                    key={category.id}
                    onSubmit={(e) => {
                      e.preventDefault();
                      saveEdit(category);
                    }}
                    className={`space-y-2 px-5 py-3 ${banded ? "bg-band" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Resolves draftIcon, not category.icon, so this
                          previews the picked icon live before saving. */}
                      <DraftIcon size={16} className="shrink-0 text-ink" aria-hidden="true" />
                      <label className="sr-only" htmlFor={`name-${category.id}`}>
                        Category name
                      </label>
                      <input
                        id={`name-${category.id}`}
                        type="text"
                        value={draftName}
                        onChange={(e) => setDraftName(e.target.value)}
                        className={`${cellInputClasses} flex-1`}
                      />
                    </div>
                    <div className="flex items-center gap-2 pl-6">
                      <label className="sr-only" htmlFor={`budget-${category.id}`}>
                        Monthly budget
                      </label>
                      <span className="font-mono text-[14px] text-dim" aria-hidden="true">
                        $
                      </span>
                      <input
                        id={`budget-${category.id}`}
                        type="number"
                        step="0.01"
                        min="0"
                        inputMode="decimal"
                        placeholder="No budget"
                        value={draftBudget}
                        onChange={(e) => setDraftBudget(e.target.value)}
                        className={`${cellInputClasses} flex-1 font-mono tabular-nums`}
                      />
                    </div>

                    <div className="pl-6">
                      <IconPicker
                        value={draftIcon}
                        onChange={setDraftIcon}
                        labelId={`icon-label-${category.id}`}
                      />
                    </div>

                    {rowError && <p className="pl-6 text-[13px] text-danger">{rowError}</p>}

                    <div className="flex gap-2 pl-6">
                      <button type="submit" disabled={busy} className={`${primaryButtonClasses} h-9 flex-1`}>
                        {savingId === category.id ? "Saving…" : "Save"}
                      </button>
                      <button type="button" onClick={cancelEdit} disabled={busy} className={cancelButtonClasses}>
                        Cancel
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={category.id}
                  className={`flex items-center gap-3 px-5 py-2.5 ${banded ? "bg-band" : ""}`}
                >
                  <CategoryIcon size={16} className="shrink-0 text-dim" aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate text-[15px]">{category.name}</span>
                  <span className="shrink-0 font-mono text-[13px] tabular-nums text-dim">
                    {category.monthlyBudget != null ? `${formatMoney(category.monthlyBudget)}/mo` : "No budget"}
                  </span>
                  <button
                    type="button"
                    aria-label={`Edit ${category.name}`}
                    onClick={() => startEdit(category)}
                    disabled={busy}
                    className={iconButtonClasses}
                  >
                    <Pencil size={15} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${category.name}`}
                    onClick={() => deleteCategory(category)}
                    disabled={busy}
                    className={iconButtonClasses}
                  >
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Hidden while a row is being edited, so the panel offers one
            form — and one icon grid — at a time. */}
        {!isEditingRow && (
          <>
            {/* The name/budget/Add row keeps its own flex layout; the picker sits
                below it, so the row isn't disturbed on either breakpoint. */}
            <form onSubmit={addCategory} className="border-t border-rule px-5 py-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
                <label className="sr-only" htmlFor="new-category-name">
                  New category name
                </label>
                <input
                  id="new-category-name"
                  type="text"
                  placeholder="New category"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className={`${inputClasses} sm:flex-1`}
                />
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor="new-category-budget">
                    Monthly budget (optional)
                  </label>
                  <span className="font-mono text-[14px] text-dim" aria-hidden="true">
                    $
                  </span>
                  <input
                    id="new-category-budget"
                    type="number"
                    step="0.01"
                    min="0"
                    inputMode="decimal"
                    placeholder="Budget"
                    value={newBudget}
                    onChange={(e) => setNewBudget(e.target.value)}
                    className={`${inputClasses} w-28 font-mono tabular-nums sm:w-32`}
                  />
                </div>
                <button type="submit" disabled={adding} className={`${primaryButtonClasses} sm:w-auto sm:px-5`}>
                  {adding ? "Adding…" : "Add"}
                </button>
              </div>

              <div className="mt-3">
                <IconPicker value={newIcon} onChange={setNewIcon} labelId="icon-label-new" />
              </div>
            </form>
            {addError && <p className="px-5 pb-4 text-[13px] text-danger">{addError}</p>}
          </>
        )}
      </div>
    </div>
  );
}

export default CategoryManager;
