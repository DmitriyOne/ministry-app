import { MINUTES_IN_HOUR } from "@/entities/ministry-day";

// How the month stands against its goal, in the one shape the summary
// needs: either there is something left to serve, or there is not.
//
// Two cases rather than three. The day screen's progress block separates
// "exactly met" from "over" because it says both in words beside a
// figure (ADR 0064); here the line under the bar answers one question —
// what is still owed — and once nothing is, there is nothing to count.
export type MonthStanding
  = | { kind: "met" }
    | { kind: "short"; minutes: number };

export const monthStanding = (
  minutes: number,
  goalHours: number,
): MonthStanding => {
  const remaining = goalHours * MINUTES_IN_HOUR - minutes;

  return remaining > 0 ? { kind: "short", minutes: remaining } : { kind: "met" };
};
