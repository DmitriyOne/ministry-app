type SplashDelayInput = {
  // Milliseconds since this document's time origin (performance.now()).
  // It OVERSTATES how long the splash has actually been on screen — the
  // origin is the navigation, while the overlay only becomes visible at
  // first paint — so the delay this returns errs towards being shorter.
  // That is the safe direction: it can only make the app appear sooner,
  // never add a wait nobody asked for.
  elapsedMs: number;
};

// How long the launch splash should be on screen before it starts leaving.
//
// Without a floor the splash flickers. The decision it waits for (is this
// running from the home-screen icon?) resolves in a microtask, so on a warm
// start the overlay would be told to leave almost immediately and the mark
// would flash for a frame or two — read as a glitch, not as a splash. The
// floor is what makes a brand mark legible where a spinner needed no such
// help: a spinner says "waiting" the instant it appears, a mark has to be
// seen.
const MIN_SPLASH_VISIBLE_MS = 420;

export const resolveSplashDelay = ({ elapsedMs }: SplashDelayInput): number => {
  // A missing or nonsensical clock reading means "assume nothing has been
  // shown yet" rather than "skip the floor": the full delay is the state
  // this function exists to guarantee.
  if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return MIN_SPLASH_VISIBLE_MS;

  const remaining = MIN_SPLASH_VISIBLE_MS - elapsedMs;
  return remaining > 0 ? Math.round(remaining) : 0;
};
