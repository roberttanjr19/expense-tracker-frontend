/** e.g. monthName(2026, 7) -> "July" */
export function monthName(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-CA", { month: "long" });
}

/** "2026-07-21" -> "07·21" */
export function formatCompactDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${month}·${day}`;
}
