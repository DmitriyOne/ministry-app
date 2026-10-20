// The arithmetic behind the hours card, with no React and no DOM — the
// same split the project already makes for resolveGate, isNavItemCurrent
// and the network state: the hook keeps the state, the decisions live
// here where a test can reach them.

// The step the minus and plus buttons move by. Five minutes, not fifteen:
// the quick-add row below them covers the bigger jumps, so these two are
// for correcting the number rather than building it.
export const HOURS_STEP_MINUTES = 5;

// The quick-add row, in minutes. Order is the order on screen.
export const HOURS_QUICK_ADD_MINUTES = [15, 30, 45] as const;

// A day cannot hold more than a day. The cap exists because the row above
// can add 45 minutes a tap: without it the card would happily show 70
// hours for one day, which reads as a broken screen rather than as a
// mistake somebody made.
export const MAX_DAY_MINUTES = 24 * 60;

// Adds (or, with a negative delta, takes away) minutes, clamped to the
// day. Clamping rather than refusing: a tap near the edge should land on
// the edge — 23:50 plus 15 minutes is 24:00, not nothing at all.
export const addMinutes = (current: number, delta: number): number =>
  Math.min(Math.max(current + delta, 0), MAX_DAY_MINUTES);

// "0:00", "1:05", "24:00". Hours are not padded and minutes always are,
// which is how a clock reads; the card draws it with tabular figures so
// the number does not jitter as it changes.
export const formatHours = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${hours}:${String(rest).padStart(2, "0")}`;
};
