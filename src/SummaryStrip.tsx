import { formatMoney } from "./money";

interface SummaryStripProps {
  /** Total income for the selected month. */
  income: number;
  /** Total spent for the selected month. */
  spent: number;
}

interface CellProps {
  label: string;
  value: string;
  /** Extra classes for the figure — the accent/danger colouring. */
  toneClasses?: string;
  /** Hairline divider on every cell but the first. */
  divided?: boolean;
}

function Cell({ label, value, toneClasses = "", divided = false }: CellProps) {
  return (
    <div
      className={`px-2 py-6 text-center sm:px-4 ${
        divided ? "border-l border-[color:var(--card-border)]" : ""
      }`}
    >
      <p className="eyebrow font-bold">{label}</p>
      {/*
        clamp rather than a fixed 22px: three cells inside a 320px screen leave
        ~96px each, and "$1,234.56" at 22px doesn't fit. This scales the figure
        down to 15px on a phone and back to the original 22px at ~520px+, so the
        row never overflows and desktop looks exactly as it did.
      */}
      <p
        className={`mt-1 font-mono text-[clamp(15px,4.2vw,22px)] tabular-nums ${toneClasses}`}
      >
        {value}
      </p>
    </div>
  );
}

/**
 * The month at a glance, as one full-width card: money in, money out, and what
 * that leaves. Split by vertical hairlines in the card's own border colour
 * (not --rule, which is the page's hairline and reads too strong inside a card).
 *
 * Net is derived here rather than passed in, so it can never disagree with the
 * two figures printed either side of it.
 */
function SummaryStrip({ income, spent }: SummaryStripProps) {
  const net = income - spent;
  // Intl supplies the leading minus for a negative on its own, and no "+" for a
  // positive — which is exactly the asymmetry we want, so this is deliberately
  // NOT formatSignedMoney.
  const netTone = net >= 0 ? "text-accent" : "text-danger";

  return (
    <section className="card">
      <div className="grid grid-cols-3">
        <Cell label="Income" value={formatMoney(income)} toneClasses="text-accent" />
        <Cell label="Spent" value={formatMoney(spent)} divided />
        <Cell label="Net" value={formatMoney(net)} toneClasses={netTone} divided />
      </div>
    </section>
  );
}

export default SummaryStrip;
