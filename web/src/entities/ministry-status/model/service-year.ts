import { type MonthKey, monthOfYear, yearOf } from "./month-key";

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
