import { useEffect, useRef, useState } from "react";
import { useTheme } from "./theme";

interface HeaderMenuProps {
  onSignOut: () => void;
  onManageCategories: () => void;
}

const menuItemClasses =
  "flex w-full items-center justify-between px-3 py-2 text-left text-[15px] text-ink hover:bg-band " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink";

/**
 * Placeholder for the full app menu (later stage). For now it only has to
 * expose the two things the old unstyled header did: signing out and a
 * dark-mode toggle.
 */
function HeaderMenu({ onSignOut, onManageCategories }: HeaderMenuProps) {
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function toggleTheme() {
    setTheme(theme === "dark" ? "light" : "dark");
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label="Menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded text-ink hover:bg-band focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path
            d="M3 5.5H17M3 10H17M3 14.5H17"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-10 w-48 rounded border border-rule bg-paper py-1 shadow-sm"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onManageCategories();
            }}
            className={menuItemClasses}
          >
            <span>Manage categories</span>
          </button>
          <button type="button" role="menuitem" onClick={toggleTheme} className={menuItemClasses}>
            <span>Dark mode</span>
            <span className="text-dim">{theme === "dark" ? "On" : "Off"}</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className={menuItemClasses}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

export default HeaderMenu;
