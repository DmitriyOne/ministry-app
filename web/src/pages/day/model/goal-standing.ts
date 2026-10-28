import { MINUTES_IN_HOUR } from "@/entities/ministry-day";

// How a total stands against its goal. The arithmetic behind the bracket
// on each progress row (ADR 0064, decision 10) — out of the component
// for the reason this project applies to every decision of this kind
// (resolveGate, isNavItemCurrent, hours-value): a test can reach it
// here, and the component is left with markup.
//
// Three cases, not a signed number. "Level" is its own case because the
// screen says "(+0)" for it rather than "+0 min", and the gap is always
// POSITIVE in the other two: the sign lives in the words beside it, so
// nothing downstream has to remember to negate anything.
//
// Here and not in entities/ministry-status, where a goal is otherwise
// that entity's business, because nothing but the day screen asks this
// yet and FSD moves code down on real reuse rather than on a guess
// (v2.1 "Pages First"). It is a DEFERRAL and not a verdict: the month
// screen will want the same sentence, and the moment it does this
// belongs to the entity — recorded in ADR 0064, decision 12, so the
// move is remembered rather than rediscovered.
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
