import { useRef } from "react";
import type { KeyboardEvent } from "react";
import {
  Briefcase,
  GraduationCap,
  Laptop,
  Palmtree,
  Pencil,
  Users,
  type LucideIcon,
} from "lucide-react";

export type Role =
  | "STUDENT"
  | "PROFESSIONAL"
  | "FREELANCER"
  | "FAMILY"
  | "RETIRED"
  | "PERSONAL";

const ROLE_OPTIONS: { label: string; value: Role; icon: LucideIcon }[] = [
  { label: "Student", value: "STUDENT", icon: GraduationCap },
  { label: "Employed", value: "PROFESSIONAL", icon: Briefcase },
  { label: "Self-employed", value: "FREELANCER", icon: Laptop },
  { label: "Family", value: "FAMILY", icon: Users },
  { label: "Retired", value: "RETIRED", icon: Palmtree },
  { label: "Just tracking", value: "PERSONAL", icon: Pencil },
];

const COLUMNS = 2;

const cardBaseClasses =
  "flex items-center gap-2 rounded-[7px] p-[10px] text-left " +
  "focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink";

function cardClasses(selected: boolean) {
  return selected
    ? `${cardBaseClasses} border-[1.5px] border-ink bg-band`
    : `${cardBaseClasses} border-[0.5px] border-rule hover:bg-band`;
}

interface RolePickerProps {
  value: Role;
  onChange: (role: Role) => void;
}

/**
 * Six role cards acting as one custom radio group: roving tabindex (only
 * the selected card is in the tab order), arrow keys move focus grid-wise,
 * Enter/Space select via the buttons' native activation. Reimplements
 * <input type="radio"> semantics on buttons because each option needs an
 * icon, not just a label.
 */
function RolePicker({ value, onChange }: RolePickerProps) {
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  function focusIndex(index: number) {
    const wrapped = (index + ROLE_OPTIONS.length) % ROLE_OPTIONS.length;
    cardRefs.current[wrapped]?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      focusIndex(index + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusIndex(index - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      focusIndex(index + COLUMNS);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      focusIndex(index - COLUMNS);
    }
  }

  return (
    <fieldset className="m-0 border-0 p-0">
      <legend className="eyebrow mb-2 p-0">Select role</legend>
      <div role="radiogroup" className="grid grid-cols-2 gap-[7px]">
        {ROLE_OPTIONS.map((option, index) => {
          const Icon = option.icon;
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cardClasses(selected)}
            >
              <Icon size={18} className="shrink-0 text-dim" aria-hidden="true" />
              <span className="text-[13.5px] leading-snug text-ink">
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-dim">
        We'll set up a few starter categories you can change anytime.
      </p>
    </fieldset>
  );
}

export default RolePicker;
