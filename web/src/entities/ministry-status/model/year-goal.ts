import { type MinistryStatusRow, resolveStatusForMonth } from "./resolve-status";
import { type ServiceYear, serviceYearMonths } from "./service-year";

// The goal for a service year is the sum of its twelve monthly goals —
// not a stored number (ADR 0061).
//
// A full pioneer year comes to exactly 600 (12 × 50), which is the
// number people know. A year that is only partly pioneered comes to the
// truth about that year instead: appointed in November, a pioneer's year
// is 500, and a stored 600 would have shown them behind from the first
// day to the last.
//
// Zero means no goal at all — a publisher's year, or a year not started.
// Screens show that as "—", never as "0 hours", because the two say
// different things.
//
// `rows` is every row this person has, not only the ones inside the
// year: a status taken two years ago and never changed is what the whole
// year reads from, and a year filtered to itself would come back empty.
export const serviceYearGoalHours = (
  rows: readonly MinistryStatusRow[],
  year: ServiceYear,
): number =>
  serviceYearMonths(year).reduce(
    (total, month) => total + (resolveStatusForMonth(rows, month).monthlyGoalHours ?? 0),
    0,
  );
