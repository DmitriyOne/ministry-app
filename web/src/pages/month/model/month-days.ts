import { type DayKey, parseDayKey } from "@/entities/ministry-day";

// One line of the table: the day, what it holds, and what the month held
// by the end of it.
//
// The running total is computed here rather than asked for: the rows are
// already in hand, and a sum per row would be thirty round trips for an
// answer addition gives for nothing. The month's own total still comes
// from the database (ministry_days_total_minutes) — this is the same
// number arrived at twice only if every day of the month is present,
// which is exactly why the screen does not derive the total from it.
export type MonthDayRow = {
  day: DayKey;
  minutes: number;
  // Everything recorded in this month up to and including this day.
  runningMinutes: number;
};

// A day with no row at all is not a line: the table lists what was
// recorded, and the calendar is the screen for what was not. A recorded
// zero IS a line — somebody looked and there was nothing — and the
// running total simply does not move across it (ADR 0062).
//
// The rows come from the database, so an unparseable day is not a thing
// that happens; it is dropped rather than trusted because every line is
// a link, and a link to /day/2026-06-31 is a 404 at the other end.
export const buildMonthDays = (
  rows: { day: string; minutes: number }[],
): MonthDayRow[] => {
  const days = rows
    .map((row) => ({ day: parseDayKey(row.day), minutes: row.minutes }))
    .filter((row): row is { day: DayKey; minutes: number } => row.day !== null)
    .sort((a, b) => a.day.localeCompare(b.day));

  let running = 0;

  return days.map((row) => {
    running += row.minutes;

    return { day: row.day, minutes: row.minutes, runningMinutes: running };
  });
};
