import { deviceTimeZone, zonedDate } from "@/shared/lib/time-zone";

import { type MonthKey, toMonthKey } from "./month-key";

// Which month a person is in, in their own calendar (ADR 0061). The zone
// itself, and the reading of a date in it, live in shared/lib/time-zone
// — ministry-day asks the same question of the same clock, and a second
// copy here would be a second calendar to keep in step.

// `now` is a parameter so the tests can stand on a month boundary, which
// is the only moment this function is interesting: at 23:00 UTC on the
// last day of October, London is still in October and Kiritimati is
// already in November, and both are right.
export const currentMonthKey = (
  timeZone: string | null | undefined,
  now: Date = new Date(),
): MonthKey => {
  const { year, month } = zonedDate(timeZone, now);

  return toMonthKey(year, month);
};

// The month the device itself is in — the authority for a WRITE (ADR
// 0061), where the server only fences a clock that has run away.
//
// Browser only, and only inside an event or an effect: called while
// rendering it would run on the server too, with the server's zone, and
// the two answers differ for a few hours twice a month — which is
// exactly the hydration mismatch nobody would reproduce.
export const deviceMonthKey = (now: Date = new Date()): MonthKey =>
  currentMonthKey(deviceTimeZone(), now);
