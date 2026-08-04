import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme";

/** Quick-access theme switch, separate from HeaderMenu's "Dark mode" item (kept in sync via useTheme). */
function ThemeToggle() {
  const [theme, setTheme] = useTheme();

  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="flex h-10 w-10 items-center justify-center rounded text-ink hover:bg-band focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
    >
      {theme === "dark" ? (
        <Sun size={18} aria-hidden="true" />
      ) : (
        <Moon size={18} aria-hidden="true" />
      )}
    </button>
  );
}

export default ThemeToggle;
