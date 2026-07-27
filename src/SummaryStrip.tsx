interface SummaryStripProps {
  spentLabel: string;
  previousMonthName: string;
  vsPreviousLabel: string;
  entryCount: number;
}

/**
 * 3 cells on larger screens (Spent / vs last month / Entries), 2 on mobile
 * (the comparison cell is the one that's least essential day-to-day, so it
 * drops first). The middle cell uses `hidden sm:block` rather than being
 * left out of the DOM, so the grid still only ever renders two hairlines.
 */
function SummaryStrip({
  spentLabel,
  previousMonthName,
  vsPreviousLabel,
  entryCount,
}: SummaryStripProps) {
  return (
    <section className="border-y border-rule">
      <div className="grid grid-cols-2 sm:grid-cols-3">
        <div className="px-4 py-6 text-center sm:px-6">
          <p className="eyebrow">Spent</p>
          <p className="mt-1 font-mono text-[22px] tabular-nums">{spentLabel}</p>
        </div>

        <div className="hidden border-l border-rule px-4 py-6 text-center sm:block sm:px-6">
          <p className="eyebrow">vs {previousMonthName}</p>
          <p className="mt-1 font-mono text-[22px] tabular-nums">{vsPreviousLabel}</p>
        </div>

        <div className="border-l border-rule px-4 py-6 text-center sm:px-6">
          <p className="eyebrow">Entries</p>
          <p className="mt-1 font-mono text-[22px] tabular-nums">{entryCount}</p>
        </div>
      </div>
    </section>
  );
}

export default SummaryStrip;
