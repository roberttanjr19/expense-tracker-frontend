const currencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
});

const signedCurrencyFormatter = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  signDisplay: "exceptZero",
});

export function formatMoney(amount: number): string {
  return currencyFormatter.format(amount);
}

/** Same as formatMoney, but always shows a leading + or - (used for the "vs last month" delta). */
export function formatSignedMoney(amount: number): string {
  return signedCurrencyFormatter.format(amount);
}
