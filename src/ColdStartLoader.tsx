interface ColdStartLoaderProps {
  /**
   * Shown for the first ~3s, before we assume a cold start. Deliberately plain
   * so a fast load doesn't flash a big reassuring card at the user.
   */
  quietLabel: string;
  /**
   * The caller's existing `slowLoading` flag — true once its fetch has been
   * pending past the 3s timer it already sets. This component owns no timer of
   * its own; it only decides what to draw for each phase.
   */
  slow: boolean;
}

/**
 * The wait state for an initial authenticated load.
 *
 * Render's free tier sleeps after inactivity, so the first request can take
 * 30-60s. Two phases: a quiet line while the request might still be normal,
 * then a card explaining the wait once it clearly isn't.
 *
 * The role="status" wrapper is rendered in BOTH phases rather than only around
 * the card. A live region announces *changes* to its contents, so a region that
 * mounts with its final text already in place is often not announced at all —
 * keeping one region mounted and swapping what's inside is what makes the 3s
 * transition reach a screen reader.
 */
function ColdStartLoader({ quietLabel, slow }: ColdStartLoaderProps) {
  return (
    // No bg-paper: the page root's dot grid shows through, so the card reads as
    // a raised surface floating on it, like every other card in the app.
    <div className="flex min-h-[calc(100dvh-80px)] flex-1 items-center justify-center px-4 py-10">
      <div
        role="status"
        aria-live="polite"
        aria-label={slow ? "Waking the server up" : "Loading"}
        className="flex w-full max-w-[380px] flex-col items-center text-center"
      >
        {slow ? (
          <div className="card flex w-full flex-col items-center px-6 py-10">
            {/* Decorative: the text below carries the same meaning, so the dots
                are hidden from the accessibility tree rather than announced. */}
            <div className="flex items-center gap-1.5" aria-hidden="true">
              <span className="loading-dot" />
              <span className="loading-dot" />
              <span className="loading-dot" />
            </div>

            <p className="mt-6 text-[16px] font-bold">Waking the server up</p>
            <p className="mt-2 max-w-[320px] text-[14px] text-dim">
              This can take up to a minute on the first visit. Hang tight.
            </p>
          </div>
        ) : (
          <p className="text-[15px] text-dim">{quietLabel}</p>
        )}
      </div>
    </div>
  );
}

export default ColdStartLoader;
