interface SummaryStripProps {
  spentLabel: string;
  entryCount: number;
}

/**
 * Two stats for the selected month, as one full-width card: what was spent,
 * and how many entries, split by a vertical hairline in the card's own
 * border colour (not --rule, which is the page's hairline and reads too
 * strong inside a card).
 */
function SummaryStrip({ spentLabel, entryCount }: SummaryStripProps) {
  return (
    <section className="card">
      <div className="grid grid-cols-2">
        <div className="px-4 py-6 text-center sm:px-6">
          <p className="eyebrow">Spent</p>
          <p className="mt-1 font-mono text-[22px] tabular-nums">{spentLabel}</p>
        </div>

        <div className="border-l border-[color:var(--card-border)] px-4 py-6 text-center sm:px-6">
          <p className="eyebrow">Entries</p>
          <p className="mt-1 font-mono text-[22px] tabular-nums">{entryCount}</p>
        </div>
      </div>
    </section>
  );
}

export default SummaryStrip;
