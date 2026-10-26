import { deviceTimeZone, zonedDate } from "@/shared/lib/time-zone";

// A day, written the way the database writes it: an ISO date,
// "2026-06-02". The same shape `date` columns and PostgREST hand back, so
// nothing is converted on the way in or out, and keys in this shape sort
// as plain strings — which is how the seven-day strip is ordered.
//
// Branded, for the reason MonthKey is (ADR 0061): a string is checked
// ONCE, where it enters — a database row, a route segment — and
// everything downstream may rely on it. Without the brand a malformed
// day reaches a screen as a heading, or the server as a write.
declare const dayKeyBrand: unique symbol;

export type DayKey = string & { readonly [dayKeyBrand]: true };

const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const MS_IN_DAY = 24 * 60 * 60 * 1000;

export const toDayKey = (year: number, month: number, day: number): DayKey =>
  `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}` as DayKey;

// The boundary. Null for anything that is not an ISO date, including the
// shapes that look close enough to be dangerous: a month that does not
// exist, a day that does not exist in that month ("2026-02-30"), and a
// timestamp with a date in front of it.
//
// The round trip through Date.UTC is what catches 30 February: the shape
// is right, so only the calendar can refuse it.
export const parseDayKey = (value: string): DayKey | null => {
  const match = DAY_KEY_PATTERN.exec(value);

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const asDate = new Date(Date.UTC(year, month - 1, day));

  if (
    asDate.getUTCFullYear() !== year
    || asDate.getUTCMonth() !== month - 1
    || asDate.getUTCDate() !== day
  ) {
    return null;
  }

  return value as DayKey;
};

// Shifts by whole days, forwards or backwards, over month and year ends
// and over a leap day. Arithmetic in UTC on purpose: a day key names a
// calendar day and has no zone of its own, and doing this in local time
// would lose or repeat an hour twice a year and with it, occasionally, a
// whole day.
export const addDays = (key: DayKey, delta: number): DayKey => {
  const [year, month, day] = key.split("-").map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day) + delta * MS_IN_DAY);

  return toDayKey(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth() + 1,
    shifted.getUTCDate(),
  );
};

// The day the person is in right now, in their own calendar. Used on the
// server, where the zone comes from the profile.
export const currentDayKey = (
  timeZone: string | null | undefined,
  now: Date = new Date(),
): DayKey => {
  const { year, month, day } = zonedDate(timeZone, now);

  return toDayKey(year, month, day);
};

// The day the device itself is in. Browser only, and only inside an
// event or an effect — on the server it would answer with the server's
// zone, and the two differ for a few hours every day.
export const deviceDayKey = (now: Date = new Date()): DayKey =>
  currentDayKey(deviceTimeZone(), now);
