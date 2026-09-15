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

/**
 * A quiet 28px icon-only control — row edit/delete affordances. Always pair
 * with an aria-label, since there's no text to announce.
 *
 * LedgerRow declares its own identical copy locally. Left alone deliberately:
 * this step must not touch the expense feature, so the two are duplicated for
 * now rather than risking a shared edit there. Worth deduping later.
 */
export const iconButtonClasses =
  "flex h-7 w-7 items-center justify-center rounded text-dim hover:bg-band hover:text-ink disabled:pointer-events-none disabled:opacity-50 " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

/** Outline counterpart to primaryButtonClasses — the Cancel half of a save/cancel pair. */
export const secondaryButtonClasses =
  "h-10 rounded border border-rule px-4 text-[15px] font-medium text-ink hover:bg-band disabled:opacity-50 " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";
