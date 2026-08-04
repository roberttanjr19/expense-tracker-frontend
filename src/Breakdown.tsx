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

function Breakdown({ totals }: BreakdownProps) {
  if (totals.length === 0) return null;

  const maxTotal = totals[0].total;

  return (
    <section className="border-t border-rule py-8">
      <p className="eyebrow">Where it went</p>

      <div className="mt-4 space-y-3">
        {totals.map((category) => {
          const CategoryIcon = resolveCategoryIcon(category.icon);
          const percent = maxTotal > 0 ? (category.total / maxTotal) * 100 : 0;

          return (
            <div key={category.id} className="flex items-center gap-3">
              <span className="flex w-24 shrink-0 items-center gap-1.5 truncate text-[13px] min-[420px]:w-32">
                <CategoryIcon size={14} className="shrink-0 text-dim" aria-hidden="true" />
                <span className="truncate">{category.name}</span>
              </span>
              <div className="h-2 flex-1 rounded-full bg-band">
                <div className="h-2 rounded-full bg-ink" style={{ width: `${percent}%` }} />
              </div>
              <span className="w-16 shrink-0 text-right font-mono text-[13px] tabular-nums min-[420px]:w-20">
                {formatMoney(category.total)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default Breakdown;
