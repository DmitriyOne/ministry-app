const MINUTES_IN_HOUR = 60;

// How a total stands against its goal, and how that difference is
// broken into hours and minutes. The arithmetic behind the bracket on
// each progress row (ADR 0064, decision 10) — here rather than inside
// the component for the reason the project applies to every decision of
// this kind (resolveGate, isNavItemCurrent, hours-value): a test can
// reach it here, and the component is left with markup.
// Three cases, not a signed number. "Level" is its own case because the
// screen says "(+0)" for it rather than "+0 min", and the gap is always
// POSITIVE in the other two: the sign lives in the words beside it, so
// nothing downstream has to remember to negate anything.
export type GoalStanding
  = { kind: "level" }
    | { kind: "ahead"; minutes: number }
    | { kind: "short"; minutes: number };

export const goalStanding = (servedMinutes: number, goalHours: number): GoalStanding => {
  const difference = servedMinutes - goalHours * MINUTES_IN_HOUR;

  if (difference === 0) return { kind: "level" };

  return difference > 0
    ? { kind: "ahead", minutes: difference }
    : { kind: "short", minutes: -difference };
};

// "28 h 10 min" is these two numbers; which words carry them is the
// dictionary's business (ADR 0014), so this only splits.
export const splitDuration = (minutes: number): { hours: number; minutes: number } => ({
  hours: Math.floor(minutes / MINUTES_IN_HOUR),
  minutes: minutes % MINUTES_IN_HOUR,
});
