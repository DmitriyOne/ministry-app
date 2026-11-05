import { addDays, type DayKey, toDayKey } from "@/entities/ministry-day";
import {
  addMonths,
  type MonthKey,
  MONTHS_IN_SERVICE_YEAR,
  type ServiceYear,
  serviceYearFirstMonth,
} from "@/entities/ministry-status";

// Which days and which months this screen is about, worked out from the
// year in the address and nothing else — the same rule the day and month
// screens follow (ADR 0067, decision 1): open 2026 and the screen
// answers for September 2026 through August 2027, whatever year the
// phone is in.
//
// In the screen's own model, like pages/month's, because it composes two
// entities: days come from ministry-day, months and the September rule
// from ministry-status, and entities may not import each other. The
// duplication against month-span.ts is what the layer rules buy; a
// shared helper would have to live in one page and be imported by the
// other, which is the cross-import FSD forbids (ADR 0067, consequences).
export type YearSpan = {
  // Both ends included, which is what the database functions take.
  from: DayKey;
  to: DayKey;
};

const yearOf = (key: MonthKey): number => Number(key.slice(0, 4));
const monthOf = (key: MonthKey): number => Number(key.slice(5, 7));

const firstDayOf = (month: MonthKey): DayKey => toDayKey(yearOf(month), monthOf(month), 1);

// September the 1st to August the 31st. The last day is the day before
// the first of the month after the twelfth, so there is no table of
// month lengths here and no leap-year rule.
export const serviceYearSpan = (year: ServiceYear): YearSpan => {
  const start = serviceYearFirstMonth(year);

  return {
    from: firstDayOf(start),
    to: addDays(firstDayOf(addMonths(start, MONTHS_IN_SERVICE_YEAR)), -1),
  };
};

// The twelve months in order, September first.
//
// Built here rather than asked of the database, although
// ministry_status_year_months returns exactly twelve rows: the table
// draws a line for every month whether or not that read succeeded, and a
// list of months that exists only when a query worked would make the
// screen's shape depend on the network.
export const serviceYearMonths = (year: ServiceYear): MonthKey[] => {
  const start = serviceYearFirstMonth(year);

  return Array.from(
    { length: MONTHS_IN_SERVICE_YEAR },
    (_, index) => addMonths(start, index),
  );
};

// Whether the arrow forward is live. False on the year the person is in,
// and false when we do not know which year that is: the zone did not
// read, and stepping forward on a guess would hand somebody a 404
// exactly at the moment the database answered again — the reasoning the
// day's arrow established (ADR 0063, update 2026-10-29) and the month's
// repeated.
export const canStepForward = (
  year: ServiceYear,
  currentYear: ServiceYear | null,
): boolean => currentYear !== null && currentYear > year;

// Whether this service year has not started yet, which is the one thing
// the screen turns into a 404.
//
// Its own name rather than canStepForward with the arguments swapped,
// for the reason written out in month-span.ts: a call that reads as its
// neighbour's typo is one a reader straightens out, and straightening it
// would open every future year without a test going red, a screen's
// notFound being out of a unit test's reach.
export const isFutureYear = (
  year: ServiceYear,
  currentYear: ServiceYear | null,
): boolean => currentYear !== null && year > currentYear;
