import { useEffect, useState } from "react";

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

// Components hold their own `theme` state (for re-rendering), but the value
// itself lives in localStorage/the DOM attribute, not in one shared React
// tree. Without this, two theme controls mounted at once (the header toggle
// and HeaderMenu's menu item) would drift out of sync: flipping one wouldn't
// update the other's label/icon until it happened to re-render for some
// other reason. Every useTheme() caller registers here so setTheme calls
// from any of them notify all the others immediately.
const listeners = new Set<(theme: Theme) => void>();

export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(() => getTheme());

  useEffect(() => {
    listeners.add(setThemeState);
    return () => {
      listeners.delete(setThemeState);
    };
  }, []);

  function updateTheme(next: Theme) {
    setTheme(next);
    listeners.forEach((listener) => listener(next));
  }

  return [theme, updateTheme];
}
