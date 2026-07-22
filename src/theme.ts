export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getStoredTheme(): Theme | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "light" || stored === "dark" ? stored : null;
}

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function applyTheme(theme: Theme) {
  document.documentElement.setAttribute("data-theme", theme);
}

/**
 * Resolves the active theme (stored choice, falling back to system
 * preference) and applies it. A blocking inline script in index.html
 * already does this before first paint to avoid a flash of the wrong
 * theme; this re-applies the same logic so the rest of the app has a
 * single source of truth to call into once a toggle exists.
 */
export function initTheme(): Theme {
  const theme = getStoredTheme() ?? getSystemTheme();
  applyTheme(theme);
  return theme;
}

/** For a future theme toggle: persists the choice and applies it immediately. */
export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function getTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}
