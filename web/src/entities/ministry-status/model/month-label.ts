import type { MonthKey } from "./month-key";

// How a month is named on a screen: "June", "January". The progress
// block on /day labels the month it is counting (ADR 0064), and a
// service year is named by its own rule elsewhere.
//
// Built once, at module load, and UTC — both for the same reasons
// entities/ministry-day/model/day-label.ts gives at length: constructing
// an Intl.DateTimeFormat is expensive, this one never varies (the app has
// one locale, ADR 0014/0023), and a MonthKey carries no zone, so
// formatting it in the server's zone would print December for a January
// key anywhere west of UTC.
//
// The locale is written out rather than imported from shared/config for
// the reason named in that file too: the barrel drags in `env.ts`, so a
// unit test of this module would fail on missing environment variables
// before reaching an assertion.
const MONTH = new Intl.DateTimeFormat("en-GB", { month: "long", timeZone: "UTC" });

// The month with its year, for a screen that is ABOUT that month and
// may be any month: "June 2026". The year is always there, unlike in
// dayHeading, which drops it for the current one — a month screen is
// paged through years, and "June" alone on it would be a question.
const MONTH_AND_YEAR = new Intl.DateTimeFormat("en-GB", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

// A month name is formatted data, not interface text, so it is not in
// the dictionary — the same line drawn between "Tuesday" and "Today" in
// dayHeading (ADR 0014).
export const formatMonthName = (month: MonthKey): string =>
  MONTH.format(new Date(`${month}T00:00:00Z`));

export const monthHeading = (month: MonthKey): string =>
  MONTH_AND_YEAR.format(new Date(`${month}T00:00:00Z`));
