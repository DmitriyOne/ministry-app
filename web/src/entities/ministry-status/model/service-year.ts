import { MINISTRY_STATUS_CATALOGUE } from "./catalogue";
import { type MonthKey, monthOfYear, monthsBetween, toMonthKey, yearOf } from "./month-key";

// The service year runs September to August. It is named by the calendar
// year it STARTS in: 2026 means September 2026 through August 2027.
//
// This rule lives here and nowhere else — in particular not in SQL,
// which deliberately knows nothing about September (ADR 0061). The
// database carries months forward without caring which year they belong
// to, so a second copy of this boundary would be a second calendar to
// keep in step.
export const SERVICE_YEAR_FIRST_MONTH = 9;

export type ServiceYear = number;

export const serviceYearOf = (key: MonthKey): ServiceYear =>
  monthOfYear(key) >= SERVICE_YEAR_FIRST_MONTH ? yearOf(key) : yearOf(key) - 1;

// The September a month belongs to: the first month of its service year.
//
// Here rather than beside the screen that asks for it, for the same
// reason the rule above is here: September is this project's one
// calendar boundary, and a second place that knows it is a second place
// to keep in step. SQL deliberately knows nothing about it (ADR 0061).
export const serviceYearStartMonth = (key: MonthKey): MonthKey =>
  toMonthKey(serviceYearOf(key), SERVICE_YEAR_FIRST_MONTH);

export const MONTHS_IN_SERVICE_YEAR = 12;

// What a regular pioneer's year adds up to, starting from a given month.
//
// The number people know is 600, and it is 600 only for somebody who
// pioneers all twelve months: the database sums the months actually
// served (ADR 0061, decision 5), so a year begun in October comes to
// 550. The sheet says this figure out loud under its sub-question —
// the two answers there differ by exactly one month, and the difference
// is the whole reason the question is asked.
//
// Derived from the catalogue rather than written out, like every other
// number about a status: 50 lives in one place.
export const serviceYearGoalFrom = (start: MonthKey): number => {
  const { goal } = MINISTRY_STATUS_CATALOGUE.regular_pioneer;
  const monthly = goal.kind === "fixed" ? goal.hours : 0;
  const served = MONTHS_IN_SERVICE_YEAR - monthsBetween(serviceYearStartMonth(start), start);

  return served * monthly;
};
