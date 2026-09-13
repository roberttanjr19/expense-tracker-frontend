import type { MonthSummary } from "./types";
import { formatMoney } from "./money";
import { monthName } from "./date";

interface PreviousMonthsProps {
  months: MonthSummary[]; // current month already excluded
  hasMore: boolean;
  allTimeTotal: number;
  onOpenMonth: (year: number, month: number) => void;
}

interface YearGroup {
  year: number;
  months: MonthSummary[];
}

/**
 * Years descending, and months descending inside each year. Sorted here
 * rather than trusted from the caller so the index reads correctly whatever
 * order the summary endpoint happens to return.
 */
function groupByYear(months: MonthSummary[]): YearGroup[] {
  const byYear = new Map<number, MonthSummary[]>();
  for (const summary of months) {
    const existing = byYear.get(summary.year);
    if (existing) existing.push(summary);
    else byYear.set(summary.year, [summary]);
  }

  return [...byYear.entries()]
    .sort(([a], [b]) => b - a)
    .map(([year, list]) => ({
      year,
      months: [...list].sort((a, b) => b.month - a.month),
    }));
}

/**
 * The ledger index: one bordered panel of ruled month rows, grouped under a
 * year heading, each row a dotted leader running from the month name to its
 * total — the contents page of a ledger book.
 *
 * Presentational only. `onOpenMonth` is the same handler the previous card
 * strip called, so a row navigates exactly where a card did.
 */
function PreviousMonths({ months, hasMore, allTimeTotal, onOpenMonth }: PreviousMonthsProps) {
  if (months.length === 0) return null;

  const groups = groupByYear(months);

  return (
    <section className="border-t border-rule py-8">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">Previous months</p>
        <p className="eyebrow whitespace-nowrap">
          All time &middot;{" "}
          <span className="font-mono normal-case tracking-normal tabular-nums">
            {formatMoney(allTimeTotal)}
          </span>
        </p>
      </div>

      {/* overflow-hidden so the banded rows are clipped by the panel's radius
          instead of squaring off its top and bottom corners. */}
      <div className="mt-4 overflow-hidden rounded-[10px] border-[0.5px] border-rule bg-paper">
        {groups.map((group, groupIndex) => (
          <div key={group.year} className={groupIndex > 0 ? "border-t border-rule" : ""}>
            <p className="eyebrow px-4 pt-3 pb-1.5">{group.year}</p>

            <ul className="divide-y divide-rule border-t border-rule">
              {group.months.map((summary, index) => {
                const label = monthName(summary.year, summary.month);
                const entryLabel = `${summary.count} ${summary.count === 1 ? "entry" : "entries"}`;

                return (
                  // Banding restarts per year group, so every group opens on a
                  // banded row rather than depending on the one above it.
                  <li key={`${summary.year}-${summary.month}`} className={index % 2 === 0 ? "bg-band" : ""}>
                    <button
                      type="button"
                      onClick={() => onOpenMonth(summary.year, summary.month)}
                      aria-label={`Open ${label} ${summary.year}, ${formatMoney(summary.total)}, ${entryLabel}`}
                      // hover:bg-chip rather than bg-band: chip is one step on
                      // from band in both themes, so the hover shift is visible
                      // on banded and unbanded rows alike. The focus ring is
                      // inset (-outline-offset-2) because the panel clips
                      // overflow — an outset ring would be cut off on the
                      // first and last rows.
                      className="flex w-full items-baseline gap-2 px-4 py-2.5 text-left transition-colors hover:bg-chip focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink"
                    >
                      <span className="shrink-0 font-medium">{label}</span>

                      {/* Dropped below 400px so a long month name and the
                          amount never fight for the same line. */}
                      <span className="hidden shrink-0 text-[13px] text-dim min-[400px]:inline">
                        &middot; {entryLabel}
                      </span>

                      {/* The leader. Empty and baseline-aligned, so its bottom
                          border lands on the text baseline and reads as a
                          continuation of the line rather than a stray rule. */}
                      <span
                        aria-hidden="true"
                        className="mx-1 min-w-[1rem] flex-1 border-b border-dotted border-rule"
                      />

                      <span className="shrink-0 font-mono tabular-nums">
                        {formatMoney(summary.total)}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        {hasMore && (
          <div
            className="border-t border-rule px-4 py-2 text-center text-[15px] text-dim"
            aria-hidden="true"
          >
            &#8943;
          </div>
        )}
      </div>
    </section>
  );
}

export default PreviousMonths;
