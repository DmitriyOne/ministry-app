// A month, written the way the database writes it: the first day of the
// month, ISO, "2026-10-01". A date rather than a "2026-10" pair because
// that is what `date` columns and PostgREST hand back, so nothing has to
// be converted on the way in or out, and because keys in this shape sort
// as plain strings.
//
// The type is branded, so the only ways to hold one are toMonthKey and
// parseMonthKey. That is not decoration: before the brand, the three
// functions here answered a malformed key three different ways — null,
// the key handed straight back, and NaN — and the NaN was the dangerous
// one, because it would have reached a screen as a year's label. Now a
// string is checked ONCE, where it enters (a database row, a form
// field), and everything downstream may rely on it.
declare const monthKeyBrand: unique symbol;

export type MonthKey = string & { readonly [monthKeyBrand]: true };

const MONTHS_IN_YEAR = 12;

// Hoisted: a literal inside the function is a new RegExp on every call,
// and this one runs once per row of a service year.
const MONTH_KEY_PATTERN = /^(\d{4})-(\d{2})-01$/;

export const toMonthKey = (year: number, month: number): MonthKey =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-01` as MonthKey;

// The boundary. Null for anything that is not a first-of-month ISO date,
// including the shapes that look close enough to be dangerous
// ("2026-10-15", "2026-13-01", "2026-10").
export const parseMonthKey = (value: string): MonthKey | null => {
  const match = MONTH_KEY_PATTERN.exec(value);
  if (!match) return null;

  const month = Number(match[2]);
  if (month < 1 || month > MONTHS_IN_YEAR) return null;

  return value as MonthKey;
};

// No regex and no failure case: a branded key cannot have another shape,
// so the two slices are enough. Internal — callers work in whole months,
// not in their parts.
const monthParts = (key: MonthKey) => ({
  year: Number(key.slice(0, 4)),
  month: Number(key.slice(5, 7)),
});

export const monthOfYear = (key: MonthKey): number => monthParts(key).month;

export const yearOf = (key: MonthKey): number => monthParts(key).year;

// Shifts by whole months, forwards or backwards, rolling the year over.
// Counting months from zero makes the rollover a single division, and
// Math.floor (not a truncating divide) is what makes it work for
// negative deltas too.
export const addMonths = (key: MonthKey, delta: number): MonthKey => {
  const { year, month } = monthParts(key);
  const absolute = year * MONTHS_IN_YEAR + (month - 1) + delta;

  return toMonthKey(
    Math.floor(absolute / MONTHS_IN_YEAR),
    (absolute % MONTHS_IN_YEAR) + 1,
  );
};
