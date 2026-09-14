import { ChevronLeft, ChevronRight } from "lucide-react";

interface PeriodStepperProps {
  monthLabel: string;
  year: number;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
  /**
   * "raised" puts the pill on the card surface with a hover lift; "plain"
   * (the default) keeps the flat outline. A variant rather than a blanket
   * restyle because the ledger page shares this component and isn't on the
   * card system yet — it renders unchanged without passing anything.
   */
  variant?: "plain" | "raised";
}

const chevronButtonClasses =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink hover:bg-band disabled:pointer-events-none disabled:opacity-30 " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function PeriodStepper({
  monthLabel,
  year,
  nextDisabled,
  onPrev,
  onNext,
  variant = "plain",
}: PeriodStepperProps) {
  const shellClasses =
    variant === "raised" ? "card-pill lift" : "rounded-full border border-rule";

  return (
    <div className={`flex h-10 max-w-full items-center gap-1 px-1 ${shellClasses}`}>
      <button type="button" aria-label="Previous month" onClick={onPrev} className={chevronButtonClasses}>
        <ChevronLeft size={16} aria-hidden="true" />
      </button>

      {/* Narrower minimum on small screens so the pill can fit between the
          wordmark and the icons at 320px without the row overflowing. */}
      <span className="min-w-[8ch] whitespace-nowrap px-1 text-center text-[14px] font-medium min-[420px]:min-w-[10ch]">
        {monthLabel} {year}
      </span>

      <button
        type="button"
        aria-label="Next month"
        onClick={onNext}
        disabled={nextDisabled}
        className={chevronButtonClasses}
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default PeriodStepper;
