import { ChevronLeft, ChevronRight } from "lucide-react";

interface PeriodStepperProps {
  monthLabel: string;
  year: number;
  nextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}

const chevronButtonClasses =
  "flex h-8 w-8 items-center justify-center rounded-full text-ink hover:bg-band disabled:pointer-events-none disabled:opacity-30 " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function PeriodStepper({ monthLabel, year, nextDisabled, onPrev, onNext }: PeriodStepperProps) {
  return (
    <div className="flex h-10 items-center gap-1 rounded-full border border-rule pr-1 pl-1">
      <button type="button" aria-label="Previous month" onClick={onPrev} className={chevronButtonClasses}>
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <span className="min-w-[10ch] px-1 text-center text-[14px] font-medium">
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
