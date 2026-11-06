import { addDays, type DayKey, toDayKey } from "@/entities/ministry-day";
import { addMonths, type MonthKey, monthsBetween } from "@/entities/ministry-status";

// Which days this screen reads, worked out from the month in the address
// and nothing else — the rule the day, month and year screens all
// follow: open September and the screen answers for September, not for
// the month the phone is in.
//
// A third copy of this arithmetic, after pages/day's and pages/month's,
// and for the reason written out there: it composes two entities (days
// from ministry-day, months from ministry-status) which may not import
// each other, and a shared helper would have to live in one page and be
// imported by another — the cross-import FSD forbids.
export type MonthSpan = {
  // Both ends included, which is what the range select takes.
  from: DayKey;
  to: DayKey;
};

const yearOf = (month: MonthKey): number => Number(month.slice(0, 4));
const monthOf = (month: MonthKey): number => Number(month.slice(5, 7));

const firstDayOf = (month: MonthKey): DayKey => toDayKey(yearOf(month), monthOf(month), 1);

// The last day is the day before the first of the month after, so there
// is no table of month lengths here and no leap-year rule.
export const monthSpan = (month: MonthKey): MonthSpan => ({
  from: firstDayOf(month),
  to: addDays(firstDayOf(addMonths(month, 1)), -1),
});

// Whether the arrow forward is live. False on the month the person is
// in, and false when we do not know which month that is: the zone did
// not read, and stepping forward on a guess would hand somebody a 404
// exactly at the moment the database answered again.
export const canStepForward = (
  month: MonthKey,
  currentMonth: MonthKey | null,
): boolean => currentMonth !== null && monthsBetween(month, currentMonth) > 0;

// Whether this month has not started yet, which is the one thing the
// screen turns into a 404 (ADR 0069, decision 2).
//
// Its own name rather than canStepForward called with the arguments the
// other way round: the two answer different questions, and an argument
// order swapped by accident would be caught by nothing.
export const isFutureMonth = (
  month: MonthKey,
  currentMonth: MonthKey | null,
): boolean => currentMonth !== null && monthsBetween(currentMonth, month) > 0;
