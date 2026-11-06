import { type DayKey, MINUTES_IN_HOUR } from "@/entities/ministry-day";
import type { MonthKey } from "@/entities/ministry-status";

// Where the service year stands against the calendar, and the one place
// on this screen whose arithmetic is NOT the month's scaled up (ADR
// 0067, decision 5).
//
// The year's goal is a SUM OF MONTHLY GOALS, not a flat figure: 50 for a
// regular pioneer, 30 for a regular auxiliary, 15 or 30 for a one-month
// auxiliary, none at all for a publisher — and the status changes
// mid-year. So dividing the year's goal by 365 days would measure
// somebody against a norm they were never under. What the calendar asks
// for by today is the goals of the months already finished, plus the
// share of this month that has passed:
//
//   needed = Σ goals of finished months
//          + goal of this month × dayOfMonth / daysInMonth
//
// The share is taken by exactly the formula monthPace uses, including
// counting today as a whole day: the question is what is needed BY
// today, not what was owed for the days gone.
//
// A desirable consequence, and the reason the sum exists at all: a
// person appointed in October is measured against 550, not 600, and so
// is not shown as behind from their first day (ADR 0061, decision 5).
export type YearPaceStanding
  = | { kind: "level" }
    | { kind: "ahead"; minutes: number }
    | { kind: "behind"; minutes: number };

export type YearPaceLine = {
  // What the calendar asks for by today, in minutes — printed beside the
  // difference, because a ± with nothing behind it is a figure nobody
  // can check.
  neededMinutes: number;
  standing: YearPaceStanding;
  // What is left to serve each MONTH for the rest of the year, this
  // month included, and over how many months. Per month rather than per
  // day: "so many minutes a day" across a year is a figure nobody uses.
  // Null once the goal is reached — there is nothing left to keep up.
  rest: { perMonthMinutes: number; months: number } | null;
};

const dayOfMonthOf = (key: DayKey): number => Number(key.slice(8, 10));
const monthOfDay = (key: DayKey): string => key.slice(0, 7);

// Null when there is nothing honest to say, by the same three tests
// monthPace applies plus one of its own:
//
//   - no goal for the year, so there is no pace to keep (the bar in the
//     card above is absent for the same reason);
//   - the person's calendar did not read, so we cannot say what day it
//     is — a pace measured against the server's day would be wrong by a
//     day for everybody west of it;
//   - the open year is not the one being lived. A year that is over has
//     no pace left: its difference against the goal IS its result;
//   - this screen's own: the finished months are not known, because the
//     per-month goals did not read. The year's total goal alone cannot
//     say what was asked for by March, only what is asked for by August.
export const yearPace = ({
  today,
  servedMinutes,
  goalHours,
  months,
}: {
  today: DayKey | null;
  servedMinutes: number;
  goalHours: number | null;
  // The twelve months in order with the goal each was held to, as the
  // table already has them.
  months: { month: MonthKey; goalHours: number | null }[] | null;
}): YearPaceLine | null => {
  if (goalHours === null || goalHours <= 0) return null;
  if (today === null) return null;
  if (months === null || months.length === 0) return null;

  // Which of the twelve the person is in. Compared as "YYYY-MM" rather
  // than by arithmetic on the year, so a day outside this service year
  // simply finds nothing — which is the "the year is not the one being
  // lived" test, and it costs no separate branch.
  const current = monthOfDay(today);
  const index = months.findIndex((entry) => entry.month.slice(0, 7) === current);

  if (index === -1) return null;

  const finished = months
    .slice(0, index)
    .reduce((sum, entry) => sum + (entry.goalHours ?? 0), 0);

  const thisMonth = months[index]?.goalHours ?? 0;
  const dayOfMonth = dayOfMonthOf(today);
  const daysInMonth = daysInMonthOf(today);

  const neededMinutes = Math.round(
    finished * MINUTES_IN_HOUR
    + (thisMonth * MINUTES_IN_HOUR * dayOfMonth) / daysInMonth,
  );

  const difference = servedMinutes - neededMinutes;
  const remaining = goalHours * MINUTES_IN_HOUR - servedMinutes;
  const monthsLeft = months.length - index;

  return {
    neededMinutes,
    // Exactly level says so rather than "+0 min", the same way the day
    // screen's bracket and the month's pace do: it is a state, not a
    // measurement of nothing.
    standing: difference === 0
      ? { kind: "level" }
      : {
          kind: difference > 0 ? "ahead" : "behind",
          minutes: Math.abs(difference),
        },
    // Rounded UP, like the month's: a rate rounded down does not reach
    // the goal, which is the one thing this figure is for.
    rest: remaining > 0
      ? { perMonthMinutes: Math.ceil(remaining / monthsLeft), months: monthsLeft }
      : null,
  };
};

// How many days the month of this day has. In UTC, like every other date
// calculation on a DayKey: a key carries no zone, and asking the
// server's zone would be a day out west of it.
const daysInMonthOf = (day: DayKey): number => {
  const year = Number(day.slice(0, 4));
  const month = Number(day.slice(5, 7));

  // Day zero of the month after is the last day of this one, which is
  // how February gets 29 in a leap year without this file knowing the
  // rule.
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
};
