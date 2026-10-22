import { type MonthKey, toMonthKey } from "./month-key";

// Which month a person is in is decided by their own calendar, not by
// the server's (ADR 0061). The zone comes from the device
// (Intl.DateTimeFormat().resolvedOptions().timeZone) and is kept on the
// profile, because the profile screen is rendered on the server and a
// server cannot ask the phone what month it is.
//
// Matches the column default in SQL, and both exist for the same reason:
// the app speaks en-GB.
export const DEFAULT_TIME_ZONE = "Europe/London";

// A zone name is only ever validated by trying it. The database checks
// the SHAPE of the string (a check constraint cannot query
// pg_timezone_names), so a well-formed name for a zone this runtime does
// not know can reach us — and `new Date().toLocaleString(…)` with an
// unknown zone throws. Everything that reads the column goes through
// here, so an unknown zone costs the default rather than the screen.
export const resolveTimeZone = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
};

// The month the person is in right now, in their own calendar. `now` is
// a parameter so the tests can stand on a month boundary, which is the
// only moment this function is interesting: at 23:00 UTC on the last day
// of October, London is still in October and Kiritimati is already in
// November, and both are right.
export const currentMonthKey = (
  timeZone: string | null | undefined,
  now: Date = new Date(),
): MonthKey => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: resolveTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
  }).formatToParts(now);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;

  // Unreachable with the options above; the fallback keeps the return
  // type honest rather than asserting non-null.
  if (!year || !month) return toMonthKey(now.getUTCFullYear(), now.getUTCMonth() + 1);

  return toMonthKey(Number(year), Number(month));
};

// The month the device itself is in — the authority for a WRITE (ADR
// 0061), where the server only fences a clock that has run away.
//
// Browser only, and only inside an event or an effect: called while
// rendering it would run on the server too, with the server's zone, and
// the two answers differ for a few hours twice a month — which is
// exactly the hydration mismatch nobody would reproduce.
export const deviceMonthKey = (now: Date = new Date()): MonthKey =>
  currentMonthKey(Intl.DateTimeFormat().resolvedOptions().timeZone, now);
