import { routes } from "@/shared/config";

import { type MonthKey, parseMonthKey } from "./month-key";

// The address of one month's screen: /month/2026-06.
//
// The same shape as dayPath, and here for the same reason given there:
// the builder takes a branded key, and `shared` may not import
// `entities`, so one living beside the route constants would have to
// accept a plain string — at which point a link to /month/garbage is one
// typo away.
//
// The slug drops the day. A MonthKey is a date inside the database
// ("2026-06-01") because that is what a `date` column hands back, but an
// address is read by people, and "2026-06-01" in it invites the question
// which day it means. The two shapes are converted at this boundary and
// nowhere else.
const MONTH_SLUG_PATTERN = /^\d{4}-\d{2}$/;

export const monthPath = (month: MonthKey): string =>
  `${routes.month}/${month.slice(0, 7)}`;

// The calendar's address for the same month: /calendar/2026-11. The
// same slug, a different screen — one asks what the month came to, the
// other which days it happened on — so the two builders sit together
// and cannot drift apart in how they spell a month (ADR 0069).
export const calendarPath = (month: MonthKey): string =>
  `${routes.calendar}/${month.slice(0, 7)}`;

// The boundary in the other direction: anything that is not YYYY-MM with
// a real month is null, and the route turns that into a 404.
//
// Checked twice on purpose. The pattern rejects the shapes that are
// close enough to be dangerous ("2026-6", "2026-06-01"), and
// parseMonthKey rejects the month numbers ("2026-13"), so the branded
// key still has exactly one way into existence.
export const parseMonthSlug = (slug: string): MonthKey | null =>
  MONTH_SLUG_PATTERN.test(slug) ? parseMonthKey(`${slug}-01`) : null;
