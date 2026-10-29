import { addDays, type DayKey, toDayKey } from "@/entities/ministry-day";
import {
  addMonths,
  type MonthKey,
  SERVICE_YEAR_FIRST_MONTH,
  serviceYearOf,
  toMonthKey,
} from "@/entities/ministry-status";

// Which days the progress block counts, worked out from the day in the
// address and nothing else (ADR 0064, decision 2). Open 15 September and
// the block answers for September, not for the month the phone is in:
// the screen is about the day it shows.
//
// That is also what keeps the reads parallel. Asking "which month is it
// now" would mean reading the person's time zone first and the totals
// after it — the waterfall ADR 0061 recorded as a debt and ADR 0063
// closed on this screen.
//
// Here, in the screen's own model, because it is the composition of two
// entities: the days come from ministry-day, the service year's boundary
// from ministry-status, and entities may not import each other. A page
// composing both is the normal direction (FSD), and each piece stays
// where its domain is.
//
// Nothing here can fail. Both keys are branded, so they can only have
// been made by their own constructors, and these functions use those
// constructors rather than the parsers: there is no malformed input to
// answer for, and a `| null` would be four branches at the call site
// guarding against a case that cannot arise.
export type ProgressSpan = {
  // Both ends included, which is what ministry_days_total_minutes takes.
  from: DayKey;
  to: DayKey;
};

// A MonthKey is a first-of-month ISO date and a DayKey an ISO date, so
// the year and the month are fixed slices of either.
const yearOf = (key: string): number => Number(key.slice(0, 4));
const monthOf = (key: string): number => Number(key.slice(5, 7));

const firstDayOf = (month: MonthKey): DayKey => toDayKey(yearOf(month), monthOf(month), 1);

// The month the open day sits in.
export const monthOfDay = (day: DayKey): MonthKey => toMonthKey(yearOf(day), monthOf(day));

// A span of whole months, from its first day to its last. The last day
// is the day before the first of the month after, so there is no table
// of month lengths here and no leap-year rule: addMonths rolls the year
// over, addDays counts in UTC (entities/ministry-day), and February 2028
// ends on the 29th without anything in this file knowing that.
const spanOfMonths = (first: MonthKey, months: number): ProgressSpan => ({
  from: firstDayOf(first),
  to: addDays(firstDayOf(addMonths(first, months)), -1),
});

export const monthSpanOf = (month: MonthKey): ProgressSpan => spanOfMonths(month, 1);

// The service year the open day sits in: September to August, twelve
// months. The boundary is the app's own (SERVICE_YEAR_FIRST_MONTH) and
// the database knows nothing about it — it counts twelve months from
// whatever it is given (ADR 0061, decision 1), so the start is worked
// out here and sent.
export const serviceYearStartOf = (month: MonthKey): MonthKey =>
  toMonthKey(serviceYearOf(month), SERVICE_YEAR_FIRST_MONTH);

export const serviceYearSpanOf = (yearStart: MonthKey): ProgressSpan =>
  spanOfMonths(yearStart, 12);
