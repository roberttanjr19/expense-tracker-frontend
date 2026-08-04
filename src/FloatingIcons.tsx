import {
  ShoppingCart,
  Home as HomeIcon,
  GraduationCap,
  Bus,
  HeartPulse,
  Gamepad2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

// Each icon's hover class names a specific character keyframe in index.css
// (cartWiggle, homeBounce, ...), scoped there to .landing-blob:hover so it
// plays only while that icon's own blob is hovered.
const ICONS: { Icon: LucideIcon; hoverClass: string }[] = [
  { Icon: ShoppingCart, hoverClass: "icon-hover-cart" },
  { Icon: HomeIcon, hoverClass: "icon-hover-home" },
  { Icon: GraduationCap, hoverClass: "icon-hover-cap" },
  { Icon: Bus, hoverClass: "icon-hover-bus" },
  { Icon: HeartPulse, hoverClass: "icon-hover-heart" },
  { Icon: Gamepad2, hoverClass: "icon-hover-pad" },
];

const ENTRANCE_MS = 300;
const STAGGER_MS = 60;
// Slightly different loop lengths per icon so the idle float never reads as
// one mechanically synced group.
const FLOAT_SECONDS = [5.2, 5.6, 6, 5.4, 5.8, 5.6];

/**
 * Decorative cluster of seed-category icons above the landing headline.
 * Entrance (fade + rise) and the idle float live on the outer wrapper via
 * inline style, since each item needs its own stagger delay / float phase;
 * the inner .landing-blob owns the hover lift so it never fights a running
 * animation on the same transform property.
 */
function FloatingIcons() {
  return (
    <div className="flex flex-wrap items-end justify-center gap-4 sm:gap-5" aria-hidden="true">
      {ICONS.map(({ Icon, hoverClass }, index) => {
        const entranceDelay = index * STAGGER_MS;
        const floatDelay = entranceDelay + ENTRANCE_MS;
        return (
          <div
            key={index}
            className="landing-anim"
            style={{
              animation:
                `landing-fade-rise ${ENTRANCE_MS}ms var(--ease-out) ${entranceDelay}ms both, ` +
                `landing-blob-float ${FLOAT_SECONDS[index]}s var(--ease-in-out) ${floatDelay}ms infinite`,
            }}
          >
            <div className="landing-blob flex h-[60px] w-[60px] items-center justify-center rounded-full bg-band text-ink sm:h-[70px] sm:w-[70px]">
              <Icon size={27} strokeWidth={2} className={hoverClass} aria-hidden="true" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default FloatingIcons;
