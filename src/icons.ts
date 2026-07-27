import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

/**
 * Backend category icon names are kebab-case (e.g. "shopping-cart");
 * lucide-react exports its components in PascalCase (ShoppingCart). Falls
 * back to a neutral Circle icon when the name is missing or doesn't match
 * any known icon, so a bad or absent icon field never crashes rendering.
 */
export function resolveCategoryIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Icons.Circle;

  const componentName = name
    .split("-")
    .filter(Boolean)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");

  const icon = (Icons as unknown as Record<string, LucideIcon | undefined>)[componentName];
  return icon ?? Icons.Circle;
}
