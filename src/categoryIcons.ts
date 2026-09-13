import type { LucideIcon } from "lucide-react";
import { resolveCategoryIcon } from "./icons";

/**
 * Neutral fallback, and what a category starts on before anything is picked.
 * Always present in the list below, so there is always a valid selection.
 */
export const DEFAULT_CATEGORY_ICON = "circle-dashed";

/**
 * The picker's menu, in display order: the neutral default first, then
 * loosely grouped by what people actually spend on (shopping and food,
 * household and bills, getting around, work and study, body, life, money).
 *
 * These are kebab-case backend names, not component names — resolveCategoryIcon
 * does that translation, and it is the ONLY place that mapping happens. This
 * list deliberately does not constrain what the app can render: a category
 * whose icon was set outside this list still resolves fine, and anything
 * unknown still falls back to Circle.
 *
 * Every name here was checked against lucide-react 1.25. Note "house", not
 * "home" — lucide v1 removed the v0 `Home` alias, so "home" would silently
 * fall back to Circle.
 */
const ICON_NAMES = [
  "circle-dashed",
  "shopping-cart",
  "shopping-bag",
  "utensils",
  "pizza",
  "coffee",
  "house",
  "plug",
  "wifi",
  "phone",
  "car",
  "bus",
  "fuel",
  "plane",
  "briefcase",
  "laptop",
  "graduation-cap",
  "book",
  "heart-pulse",
  "dumbbell",
  "shirt",
  "gift",
  "baby",
  "paw-print",
  "gamepad-2",
  "music",
  "film",
  "piggy-bank",
  "landmark",
  "wrench",
];

export interface CategoryIconOption {
  /** The kebab-case name stored on the category. */
  name: string;
  Icon: LucideIcon;
  /** Human-readable, for the option's accessible name. */
  label: string;
}

/** "shopping-cart" -> "Shopping cart" */
function humanize(name: string): string {
  const words = name.split("-").filter(Boolean).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

// Resolved once at module load, so these are stable component references
// rather than something recreated on every render.
export const CATEGORY_ICONS: CategoryIconOption[] = ICON_NAMES.map((name) => ({
  name,
  Icon: resolveCategoryIcon(name),
  label: humanize(name),
}));
