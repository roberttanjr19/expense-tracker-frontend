import { useEffect, useState } from "react";
import type { Category } from "./types";

interface CategoryRowProps {
  category: Category;
  isEditing: boolean;
  saving: boolean;
  deleting: boolean;
  error: string;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}

function CategoryRow({
  category,
  isEditing,
  saving,
  deleting,
  error,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: CategoryRowProps) {
  const [name, setName] = useState(category.name);

  // Same reasoning as ExpenseRow: this component stays mounted between
  // edits, so re-sync from the category each time edit mode is entered.
  useEffect(() => {
    if (isEditing) {
      setName(category.name);
    }
  }, [isEditing, category]);

  const busy = saving || deleting;

  if (isEditing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(category.id, name);
        }}
        className="rounded border border-blue-200 bg-blue-50 p-2 space-y-2"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 rounded border border-gray-300 p-1.5"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            type="button"
            onClick={onCancelEdit}
            disabled={saving}
            className="rounded border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>

        {error && (
          <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
            {error}
          </p>
        )}
      </form>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between rounded border border-gray-200 p-2">
        <span className="text-sm text-gray-900">{category.name}</span>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onStartEdit}
            disabled={busy}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
          >
            Rename
          </button>
          <button
            type="button"
            onClick={() => onDelete(category.id)}
            disabled={busy}
            className="text-xs font-medium text-red-600 hover:text-red-700 hover:underline disabled:opacity-50 disabled:no-underline"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

export default CategoryRow;
