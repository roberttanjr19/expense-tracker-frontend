const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const signedCurrencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  signDisplay: "exceptZero",
});

const roundedCurrencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0,
});

export function formatMoney(amount: number): string {
  return currencyFormatter.format(amount);
}

/**
 * Whole dollars, no cents. Used for budget figures, where the cents are
 * noise next to a round monthly limit — the ledger's own amounts and totals
 * stay on formatMoney so they still reconcile to the penny.
 */
export function formatMoneyRounded(amount: number): string {
  return roundedCurrencyFormatter.format(amount);
}

/** Same as formatMoney, but always shows a leading + or - (used for the "vs last month" delta). */
export function formatSignedMoney(amount: number): string {
  return signedCurrencyFormatter.format(amount);
}
