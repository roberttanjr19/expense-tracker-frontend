import type { MonthSummary } from "./types";
import { formatMoney } from "./money";

interface PreviousMonthsProps {
  months: MonthSummary[]; // capped at ~4, most-recent-first, current month already excluded
  hasMore: boolean;
  allTimeTotal: number;
  onOpenMonth: (year: number, month: number) => void;
}

function monthCardLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("en-CA", { month: "short" });
}

function PreviousMonths({ months, hasMore, allTimeTotal, onOpenMonth }: PreviousMonthsProps) {
  if (months.length === 0) return null;

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

      <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
        {months.map((m) => (
          <button
            key={`${m.year}-${m.month}`}
            type="button"
            onClick={() => onOpenMonth(m.year, m.month)}
            className="flex-none rounded border border-rule px-4 py-3 text-left hover:bg-band focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          >
            <p className="text-[13px] text-dim">{monthCardLabel(m.year, m.month)}</p>
            <p className="mt-1 font-mono text-[15px] tabular-nums">{formatMoney(m.total)}</p>
          </button>
        ))}

        {hasMore && (
          <div
            className="flex flex-none items-center px-3 text-[15px] text-dim"
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
