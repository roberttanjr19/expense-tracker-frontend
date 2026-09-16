import { formatMoney } from "./money";
import { resolveCategoryIcon } from "./icons";

export interface CategoryTotal {
  id: number;
  name: string;
  icon?: string | null;
  total: number;
}

interface BreakdownProps {
  totals: CategoryTotal[]; // pre-sorted largest first
}

/**
 * Part-to-whole only reads at a glance up to about six segments; past that the
 * tail turns into slivers nobody can compare. Anything beyond the fifth
 * category folds into a single "Other", so the donut draws at most six arcs
 * and "Other" always lands on the lightest shade.
 */
const MAX_SLICES = 6;

const RADIUS = 45;
const STROKE = 20;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Surface-coloured gap between adjacent arcs, in viewBox units. */
const ARC_GAP = 2;

interface Slice {
  key: string;
  name: string;
  icon?: string | null;
  total: number;
  percent: number;
  shade: string;
  /** Arc length along the circle, in viewBox units. */
  length: number;
  /** Distance from 12 o'clock to this arc's start. */
  offset: number;
}

/**
 * Whole percentages that actually add up to 100.
 *
 * Rounding each share independently lands on 99 or 101 often enough to look
 * like a bug, and the percentage column is the main thing a donut adds over
 * bars. Largest-remainder: floor everything, then hand the leftover points to
 * the largest fractional parts.
 */
function wholePercents(values: number[], sum: number): number[] {
  if (sum <= 0) return values.map(() => 0);

  const exact = values.map((value) => (value / sum) * 100);
  const result = exact.map(Math.floor);
  let leftover = 100 - result.reduce((a, b) => a + b, 0);

  const byFraction = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction);

  for (let i = 0; i < byFraction.length && leftover > 0; i++, leftover--) {
    result[byFraction[i].index]++;
  }
  return result;
}

/**
 * "Where it went" — the month's spend as a monochrome donut plus a legend.
 *
 * Presentational, and the props are unchanged from the bar version it replaces,
 * so the ledger page renders it exactly as before.
 *
 * The shade ramp lives in CSS (--chart-shade-1..6) rather than a JS array, so
 * it re-points itself when the theme attribute changes — biggest slice darkest
 * on the light card, lightest on the dark one — with no theme detection here.
 *
 * Note this is a genuine part-to-whole chart: the bars it replaces sized each
 * category against the LARGEST one, so the top category was always a full bar.
 * These arcs are shares of the month's total, which is why percentages can be
 * shown at all.
 *
 * No draw-in animation on purpose. The ledger refetches after every add, edit
 * and delete, so an entrance would replay on each one — an animation that
 * fires every time you fix a typo stops reading as polish.
 */
function Breakdown({ totals }: BreakdownProps) {
  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0);

  if (totals.length === 0 || grandTotal <= 0) {
    return (
      <section className="border-t border-rule py-8">
        <p className="eyebrow">Where it went</p>
        <p className="mt-4 text-[15px] text-dim">No spending to break down yet.</p>
      </section>
    );
  }

  // Fold the tail into "Other" once there are more segments than the eye can
  // compare. totals arrives largest-first, so slicing is enough to pick it.
  const grouped =
    totals.length > MAX_SLICES
      ? [
          ...totals.slice(0, MAX_SLICES - 1).map((t) => ({
            key: String(t.id),
            name: t.name,
            icon: t.icon,
            total: t.total,
          })),
          {
            key: "other",
            name: "Other",
            icon: null as string | null,
            total: totals
              .slice(MAX_SLICES - 1)
              .reduce((sum, t) => sum + t.total, 0),
          },
        ]
      : totals.map((t) => ({
          key: String(t.id),
          name: t.name,
          icon: t.icon,
          total: t.total,
        }));

  const percents = wholePercents(
    grouped.map((g) => g.total),
    grandTotal
  );

  // A lone slice is a closed ring, so it gets no gap — otherwise a full circle
  // renders with one arbitrary notch in it.
  const gap = grouped.length > 1 ? ARC_GAP : 0;

  const lengths = grouped.map((group) => (group.total / grandTotal) * CIRCUMFERENCE);

  const slices: Slice[] = grouped.map((group, index) => ({
    ...group,
    percent: percents[index],
    shade: `var(--chart-shade-${index + 1})`,
    length: lengths[index],
    // Exclusive prefix sum: this arc starts where every arc before it ended.
    // Recomputed per slice rather than carried in a running accumulator, which
    // keeps the map pure (react-hooks/immutability) — and with at most six
    // slices the quadratic cost is nothing.
    offset: lengths.slice(0, index).reduce((sum, len) => sum + len, 0),
  }));

  const summary = `Spending breakdown: ${slices
    .map((slice) => `${slice.name} ${slice.percent}%`)
    .join(", ")}`;

  return (
    <section className="border-t border-rule py-8">
      <p className="eyebrow">Where it went</p>

      {/*
        Stacked at 320px, side by side once there's room for both.

        Capped rather than left to fill the ledger's 1100px main: with the
        legend free to stretch, each row's flex-1 name column absorbed all the
        slack and threw the amount and percentage to the far right, leaving a
        lake of empty space mid-row. 520px keeps the donut, the names and the
        figures reading as one object.
      */}
      <div className="mt-4 flex max-w-[520px] flex-col items-center gap-6 min-[560px]:flex-row min-[560px]:items-center min-[560px]:gap-6">
        <div className="relative h-[160px] w-[160px] shrink-0">
          {/*
            role="img" with a summary label: the arcs are one picture, not
            thirty nodes to tab through. The legend below/beside is the real
            readable content, which is why nothing in here is focusable.
          */}
          <svg viewBox="0 0 120 120" role="img" aria-label={summary} className="h-full w-full">
            {/* Rotated so the first (largest) slice starts at 12 o'clock
                rather than 3, which is where a reader expects it to begin. */}
            <g transform="rotate(-90 60 60)">
              {slices.map((slice) => (
                <circle
                  key={slice.key}
                  cx="60"
                  cy="60"
                  r={RADIUS}
                  fill="none"
                  stroke={slice.shade}
                  strokeWidth={STROKE}
                  // dasharray draws one visible run then a gap long enough to
                  // cover the rest of the circle; dashoffset rotates that run
                  // to where this slice starts. Clamped so a sub-gap sliver
                  // still renders as a hairline instead of inverting.
                  strokeDasharray={`${Math.max(slice.length - gap, 0.5)} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-slice.offset}
                />
              ))}
            </g>
          </svg>

          {/* An HTML overlay rather than <text>: it inherits the app's type
              tokens and tabular-nums directly. aria-hidden because the label
              on the svg and the legend already state the same figures. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"
          >
            <p className="eyebrow">Total</p>
            <p className="mt-0.5 font-mono text-[17px] font-semibold tabular-nums">
              {formatMoney(grandTotal)}
            </p>
          </div>
        </div>

        <ul className="w-full min-w-0 flex-1 space-y-2.5">
          {slices.map((slice) => {
            const CategoryIcon = resolveCategoryIcon(slice.icon);

            return (
              <li key={slice.key} className="flex items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                  style={{ backgroundColor: slice.shade }}
                />
                <CategoryIcon size={14} className="shrink-0 text-dim" aria-hidden="true" />
                <span className="min-w-0 flex-1 truncate text-[13px]">{slice.name}</span>
                <span className="shrink-0 font-mono text-[13px] tabular-nums text-dim">
                  {formatMoney(slice.total)}
                </span>
                <span className="w-9 shrink-0 text-right font-mono text-[13px] tabular-nums">
                  {slice.percent}%
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export default Breakdown;
