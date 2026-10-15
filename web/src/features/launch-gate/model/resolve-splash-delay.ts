type SplashDelayInput = {
  // performance.now() — milliseconds since this document's time origin,
  // which is the navigation, NOT the moment anything appeared on screen.
  nowMs: number;
  // When the browser first painted, from the Paint Timing API, relative to
  // the same origin as nowMs. null when the entry is unavailable.
  firstPaintMs: number | null;
  // The floor, read from --shell-splash-dwell (globals.css).
  dwellMs: number;
};

// How much longer the launch splash should stay before it starts leaving.
//
// The first cut of this measured from `performance.now()` alone, treating
// time since the navigation as time the splash had been visible. That is
// wrong by however long the document took to paint, and wrong in the
// direction that matters: on a real iPhone, hydration lands well after the
// floor has notionally passed, so the answer was almost always 0 and the
// splash left while its own entrance animation was still playing. The mark
// began dissolving before it had finished arriving — which is exactly the
// "animation too short to see at all" the owner reported.
//
// So the clock has to be the one the eye uses: first paint, which is when
// the server-rendered overlay actually appeared.
export const resolveSplashDelay = ({ nowMs, firstPaintMs, dwellMs }: SplashDelayInput): number => {
  if (!Number.isFinite(dwellMs) || dwellMs <= 0) return 0;

  // No paint entry means we cannot tell how long the splash has been up.
  // Grant the whole floor rather than guess: showing the splash for its
  // full length is the behaviour this function exists to guarantee, and
  // the cost of being wrong here is a fraction of a second.
  if (firstPaintMs === null || !Number.isFinite(firstPaintMs) || !Number.isFinite(nowMs)) {
    return Math.round(dwellMs);
  }

  const visibleMs = nowMs - firstPaintMs;
  // A negative reading would mean "painted after now", which cannot
  // happen; treat it as nothing having been shown yet.
  const remaining = dwellMs - Math.max(0, visibleMs);

  return remaining > 0 ? Math.round(remaining) : 0;
};
