import { Link } from "react-router-dom";
import Logo from "./Logo";
import FloatingIcons from "./FloatingIcons";

const ENTRANCE_MS = 300;
// Hero text/CTA enter after the icon cluster above them has mostly settled
// (6 icons * 60ms stagger + their own 300ms entrance).
const HERO_BASE_DELAY_MS = 360;

function entranceStyle(delayMs: number) {
  return { animation: `landing-fade-rise ${ENTRANCE_MS}ms var(--ease-out) ${delayMs}ms both` };
}

/** Public marketing page shown at "/" when logged out; links into /login. */
function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-paper text-ink">
      <header className="border-b border-rule px-6 py-4 sm:px-8 sm:py-5">
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo size={26} className="text-ink" />
            <span className="text-[16px] font-bold">Daybook</span>
          </div>

          <div className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/login"
              className="landing-btn rounded px-2 py-2 text-[13px] text-ink hover:text-dim focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:px-3 sm:text-[14px]"
            >
              Sign in
            </Link>
            <Link
              to="/login"
              className="landing-btn rounded bg-ink px-2.5 py-2 text-[13px] font-medium text-paper hover:opacity-90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink sm:px-4 sm:text-[14px]"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[900px] flex-1 flex-col items-center justify-center px-4 py-14 text-center sm:px-6 sm:py-20">
        <div className="mb-8 sm:mb-10">
          <FloatingIcons />
        </div>

        <h1
          className="landing-anim max-w-[18ch] text-[clamp(32px,7vw,46px)] font-bold leading-[1.1]"
          style={entranceStyle(HERO_BASE_DELAY_MS)}
        >
          Know where it went.
        </h1>

        <p
          className="landing-anim mt-4 max-w-[46ch] text-[16px] text-dim sm:text-[17px]"
          style={entranceStyle(HERO_BASE_DELAY_MS + 60)}
        >
          A running record of what you spend — logged, sorted into categories, and summed as
          you go.
        </p>

        <Link
          to="/login"
          className="landing-btn landing-anim mt-8 rounded bg-ink px-6 py-3 text-[15px] font-medium text-paper hover:opacity-90 focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
          style={entranceStyle(HERO_BASE_DELAY_MS + 120)}
        >
          Get started
        </Link>
      </main>
    </div>
  );
}

export default Landing;
