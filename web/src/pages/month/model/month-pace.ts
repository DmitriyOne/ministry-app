import { type DayKey, MINUTES_IN_HOUR } from "@/entities/ministry-day";
import type { MonthKey } from "@/entities/ministry-status";

import { monthSpan } from "./month-span";

// Where the month stands against the calendar, not just against its
// goal: by the 14th of a 30-day month, a 30 h goal asks for 14 h, and
// somebody holding 12 h is two hours behind — which "18 h to go" does
// not say, because it does not know what day it is.
//
// The owner asked for it on 2026-11-02 and worked it twice: goal 30 h,
// day 14 of 30, served 12 h is −2 h; auxiliary pioneer on 15 h, day 18
// of 30, served 21 h is +12 h. The current day counts as a whole day in
// both — the target is "what is needed BY the 14th", not "what was owed
// for the 13 days gone". The same reading runs through `perDay` below:
// today is a day it can still be served in.
//
// This reverses nothing. What was turned down twice before (ADR 0064,
// decision 10; ADR 0066, decision 3) was the same arithmetic squeezed
// into a parenthetical beside another number, where "(−25 h 16 min)"
// read as noise. Here it is a line of its own with a bar under it, in
// the shape of the day screen's progress block, and the figure it is
// measured from is printed beside it.
//
// To the minute, not to the hour: an earlier pass rounded both ends to
// whole hours and the owner turned it down (2026-11-02) — "+1 h 25 min"
// is what the line has to say. Minutes are also what makes the figures
// check out against each other: a goal divided by the days of a month
// rarely lands on the hour.
export type PaceStanding
  = | { kind: "level" }
    | { kind: "ahead"; minutes: number }
    | { kind: "behind"; minutes: number };

export type MonthPaceLine = {
  // What the calendar asks for by today, in minutes — printed beside the
  // difference, because a ± with nothing behind it is a figure nobody
  // can check.
  neededMinutes: number;
  dayOfMonth: number;
  standing: PaceStanding;
  // What is left to serve each day for the rest of the month, today
  // included, and over how many days. Null once the goal is reached:
  // there is nothing left to keep up.
  rest: { perDayMinutes: number; days: number } | null;
};

const dayOfMonthOf = (key: DayKey): number => Number(key.slice(8, 10));

// Null when there is nothing honest to say:
//
//   - no goal for the month, so there is no pace to keep (the bar above
//     is absent for the same reason);
//   - the person's calendar did not read, so we cannot say what day it
//     is — and a pace measured against the server's day would be wrong
//     by a day for everybody west of it;
//   - the open month is not the month being lived. A month that is over
//     has no pace left: its difference against the goal IS its result,
//     and the line under the bar already says that. A line claiming
//     "behind by 6 h" on a month closed three weeks ago would be asking
//     for something nobody can still serve.
export const monthPace = ({
  month,
  today,
  servedMinutes,
  goalHours,
}: {
  month: MonthKey;
  today: DayKey | null;
  servedMinutes: number;
  goalHours: number | null;
}): MonthPaceLine | null => {
  if (goalHours === null || goalHours <= 0) return null;
  if (today === null) return null;

  const span = monthSpan(month);

  if (today < span.from || today > span.to) return null;

  const dayOfMonth = dayOfMonthOf(today);
  const daysInMonth = dayOfMonthOf(span.to);
  const goalMinutes = goalHours * MINUTES_IN_HOUR;

  const neededMinutes = Math.round((goalMinutes * dayOfMonth) / daysInMonth);
  const difference = servedMinutes - neededMinutes;

  const remaining = goalMinutes - servedMinutes;
  const daysLeft = daysInMonth - dayOfMonth + 1;

  return {
    neededMinutes,
    dayOfMonth,
    // Exactly level says so rather than "+0 min", the same way the day
    // screen's bracket does: it is a state, not a measurement of
    // nothing.
    standing: difference === 0
      ? { kind: "level" }
      : {
          kind: difference > 0 ? "ahead" : "behind",
          minutes: Math.abs(difference),
        },
    // Rounded UP: a rate rounded down does not reach the goal, which is
    // the one thing this figure is for.
    rest: remaining > 0
      ? { perDayMinutes: Math.ceil(remaining / daysLeft), days: daysLeft }
      : null,
  };
};
