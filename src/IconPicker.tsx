import { useRef } from "react";
import { CATEGORY_ICONS } from "./categoryIcons";

interface IconPickerProps {
  /** Currently selected icon name. May be a name outside CATEGORY_ICONS. */
  value: string;
  onChange: (name: string) => void;
  /** Unique per instance — several pickers can be mounted at once (one per edit row, one in the add form). */
  labelId: string;
}

/**
 * A radio group of icon tiles.
 *
 * role="radiogroup" + role="radio" + aria-checked rather than a pile of
 * buttons, because "one of these is chosen" is exactly what a radio group
 * means: a screen reader announces the selection and the position in the set,
 * so the state never rests on the highlight colour alone.
 *
 * That pattern brings two obligations, both handled below: roving tabindex
 * (the group is ONE tab stop, not thirty) and arrow-key navigation.
 */
function IconPicker({ value, onChange, labelId }: IconPickerProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  const selectedIndex = CATEGORY_ICONS.findIndex((option) => option.name === value);
  // A category may carry an icon that isn't in the curated list. Falling back
  // to 0 keeps exactly one tile tabbable — without it nothing would have
  // tabIndex 0 and the whole group would drop out of the tab order.
  const rovingIndex = selectedIndex === -1 ? 0 : selectedIndex;

  function selectAt(index: number) {
    const wrapped = (index + CATEGORY_ICONS.length) % CATEGORY_ICONS.length;
    const next = CATEGORY_ICONS[wrapped];
    onChange(next.name);
    // Safe to focus synchronously: the tile already exists in the DOM, only
    // its tabIndex changes on the coming re-render.
    gridRef.current?.querySelector<HTMLButtonElement>(`[data-icon="${next.name}"]`)?.focus();
  }

  /**
   * Treated as one wrapping sequence rather than a 2-D grid: the column count
   * comes from auto-fill and changes with the container width, so there's no
   * honest "one row up" to move to. Left/Up step back, Right/Down step
   * forward, which is what a wrapping palette reads like anyway.
   */
  function handleKeyDown(e: React.KeyboardEvent) {
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        selectAt(rovingIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        selectAt(rovingIndex - 1);
        break;
      case "Home":
        e.preventDefault();
        selectAt(0);
        break;
      case "End":
        e.preventDefault();
        selectAt(CATEGORY_ICONS.length - 1);
        break;
    }
  }

  return (
    <div>
      <p id={labelId} className="mb-1.5 text-[13px] text-dim">
        Icon
      </p>

      {/* auto-fill rather than a fixed column count, so the grid reflows to
          whatever width it's given and never scrolls sideways on mobile. The
          height cap only bites on narrow screens, where fewer columns push
          the tiles onto more rows. */}
      <div
        ref={gridRef}
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={handleKeyDown}
        className="grid max-h-[152px] grid-cols-[repeat(auto-fill,minmax(2rem,1fr))] gap-1.5 overflow-y-auto rounded border border-rule p-2"
      >
        {CATEGORY_ICONS.map((option, index) => {
          const { Icon } = option;
          const selected = option.name === value;

          return (
            <button
              key={option.name}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              data-icon={option.name}
              tabIndex={index === rovingIndex ? 0 : -1}
              onClick={() => onChange(option.name)}
              // Every tile carries a 1.5px border, transparent when unselected,
              // so selecting one recolours the border instead of resizing the
              // tile and reflowing the grid. Focus ring is inset because the
              // grid clips overflow.
              className={`flex aspect-square items-center justify-center rounded border-[1.5px] text-ink transition-colors focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink ${
                selected ? "border-ink bg-band" : "border-transparent bg-chip hover:bg-band"
              }`}
            >
              <Icon size={15} aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default IconPicker;
