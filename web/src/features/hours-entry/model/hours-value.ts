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

// How the number is PRINTED is not here any more: formatHours moved to
// entities/ministry-day when the progress block began printing the same
// thing for a month and a service year (ADR 0064). What stays here is
// the arithmetic of one day.

// Whether a button with this delta is worth offering at all: false at
// zero going down and at the cap going up.
//
// Here rather than in the component so that the button and the
// arithmetic cannot disagree about the edges — it asks the very function
// that does the adding, and a test can hold it to that.
export const wouldChange = (current: number, delta: number): boolean =>
  addMinutes(current, delta) !== current;
