import { routes } from "@/shared/config";

import { type MonthKey, toMonthKey } from "./month-key";
import {
  SERVICE_YEAR_FIRST_MONTH,
  type ServiceYear,
  serviceYearOf,
} from "./service-year";

// The address of one service year's screen: /year/2026, meaning
// September 2026 through August 2027.
//
// Third of these builders after dayPath and monthPath, and here for the
// reason both of them give: it takes the branded thing rather than a
// plain string, and `shared` may not import `entities`, so one living
// beside the route constants would accept any number — at which point a
// link to /year/0 is one typo away.
//
// The slug is the YEAR IT STARTS IN, four digits. Not "2026-2027", which
// is how the screen titles itself, and not "2026-09", which is what the
// key underneath looks like. A service year has exactly one name people
// use for it, and that name is the first year; the heading spells both
// out because a heading has the room.
const YEAR_SLUG_PATTERN = /^\d{4}$/;

// The range this project is willing to call a service year. Not a
// business rule — a sanity bound, so that /year/0 and /year/9999 are
// 404s rather than screens offering to page through nine thousand years
// of nothing. Wide enough that nobody meets it: hours before the app
// existed are deliberately allowed (ADR 0062), and 1970 is earlier than
// anyone recording ministry in this app has been alive to serve.
const EARLIEST_SERVICE_YEAR = 1970;
const LATEST_SERVICE_YEAR = 2200;

export const yearPath = (year: ServiceYear): string => `${routes.year}/${year}`;

// The boundary in the other direction: anything that is not four digits
// inside the range above is null, and the route turns that into a 404.
export const parseYearSlug = (slug: string): ServiceYear | null => {
  if (!YEAR_SLUG_PATTERN.test(slug)) return null;

  const year = Number(slug);

  return year >= EARLIEST_SERVICE_YEAR && year <= LATEST_SERVICE_YEAR ? year : null;
};

// The service year a month belongs to, as its address. The months table
// links every row to its month, and the arrows step by year; this is the
// one conversion the other direction needs.
export const yearPathOfMonth = (month: MonthKey): string =>
  yearPath(serviceYearOf(month));

// September of this service year — the key every read on the screen is
// measured from, and the argument the database functions take.
//
// serviceYearStartMonth answers the same question from a MONTH; this one
// answers it from the year itself, which is what the address carries.
export const serviceYearFirstMonth = (year: ServiceYear): MonthKey =>
  toMonthKey(year, SERVICE_YEAR_FIRST_MONTH);
