import type { ServiceYear } from "./service-year";

// How a service year is named on a screen: "2026 / 2027".
//
// Both years, because one of them is a question. A service year runs
// September to August, so "2026" alone leaves the reader working out
// whether the following spring is in it; the slash says it is. The
// address keeps the short form (/year/2026) — an address is typed and
// shared, a heading is read.
//
// Formatted data rather than interface text, so it is not in the
// dictionary: the same line this project draws between "Tuesday" and
// "Today" (ADR 0014). It carries no words, only digits and a separator,
// and translating a slash is not a thing.
//
// No Intl here, unlike month and day labels: there is nothing to
// localise about two integers, and a DateTimeFormat would need a date
// to format, which would put a UTC question where there is none.
export const yearHeading = (year: ServiceYear): string => `${year} / ${year + 1}`;
