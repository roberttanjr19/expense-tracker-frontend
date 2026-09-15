import { createElement, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { CATEGORY_ICONS } from "./categoryIcons";
import { resolveCategoryIcon } from "./icons";

interface IconPickerProps {
  /** Currently selected icon name. May be a name outside CATEGORY_ICONS. */
  value: string;
  onChange: (name: string) => void;
  /** Unique per instance — several pickers can be mounted at once (one per edit row, one in the add form). */
  labelId: string;
}

/**
 * Renders one icon by its backend name.
 *
 * createElement rather than binding the resolved icon to a capitalised local
 * and rendering <Icon />. react-hooks/static-components flags that shape
 * anywhere in a render path — the resolved value looks like a component type
 * created during render, which would reset state if it held any. These are
 * stateless SVGs, so the warning is a false positive here, but createElement
 * expresses "call this with props" without tripping the heuristic. The .map()
 * call sites elsewhere (BudgetList, CategoryManager) avoid it by resolving
 * inside a callback rather than a component body.
 */
function categoryIconMark(name: string) {
  return createElement(resolveCategoryIcon(name), {
    size: 15,
    className: "shrink-0 text-ink",
    "aria-hidden": true,
  });
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
 *
 * The grid itself is collapsed behind a trigger that previews the current
 * selection, so a thirty-tile palette doesn't dominate a form whose icon is
 * usually left alone. Opening it is a disclosure, not a menu: it stays open
 * while you pick, because arrow-key navigation fires onChange on every step
 * and a close-on-select would slam it shut mid-keyboard-navigation.
 */
function IconPicker({ value, onChange, labelId }: IconPickerProps) {
  const gridRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const gridId = `${labelId}-grid`;

  const selectedLabel =
    CATEGORY_ICONS.find((option) => option.name === value)?.label ?? "Custom";

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
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-controls={gridId}
        className="flex w-full items-center justify-between gap-2 rounded border border-rule px-3 py-2 text-left transition-colors hover:bg-band focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
      >
        {/* Still the radiogroup's label, so the group announces as "Icon"
            exactly as it did when this was a standalone <p>. */}
        <span id={labelId} className="text-[13px] text-dim">
          Icon
        </span>

        <span className="flex min-w-0 items-center gap-1.5">
          {/* Resolved rather than read off CATEGORY_ICONS, so a category
              carrying an icon from outside the curated list still previews
              its real icon rather than the fallback. */}
          {categoryIconMark(value)}
          <span className="truncate text-[13px]">{selectedLabel}</span>
          <ChevronDown
            size={14}
            aria-hidden="true"
            className={`shrink-0 text-dim transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>

      {/*
        inert while closed for the same reason the income add-form needs it:
        the collapse only clips the grid, so without it every icon tile stays
        in the accessibility tree and the roving-tabindex tile stays tabbable.
      */}
      <div id={gridId} data-open={open} inert={!open} className="collapsible">
        <div className="pt-1.5">
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
      </div>
    </div>
  );
}

export default IconPicker;
