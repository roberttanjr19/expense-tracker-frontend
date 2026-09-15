export const inputClasses =
  "h-10 w-full rounded border border-rule bg-paper px-3 text-[15px] text-ink placeholder:text-dim " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-ink";

export const linkButtonClasses =
  "underline underline-offset-2 text-dim hover:text-ink " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 " +
  "focus-visible:outline-offset-2 focus-visible:outline-ink";

/*
 * The primary button minus its font-weight, so callers can pick one. The weight
 * is NOT left to be appended as an extra utility: Tailwind v4 emits font-weight
 * utilities alphabetically, so `.font-medium` lands after `.font-bold` in the
 * stylesheet and would win the cascade no matter which class came last in the
 * className string. Choosing exactly one here avoids that trap.
 */
const primaryButtonBase =
  "h-10 w-full rounded bg-ink px-4 text-[15px] text-paper hover:opacity-90 disabled:opacity-50 " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

export const primaryButtonClasses = `${primaryButtonBase} font-medium`;

/** Same button, weight 700 — home's "Add entry". */
export const primaryButtonBoldClasses = `${primaryButtonBase} font-bold`;
