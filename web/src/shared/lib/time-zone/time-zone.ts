// Which calendar day — and therefore which month — a person is in is
// decided by their own zone, not by the server's (ADR 0061). The zone
// comes from the device (Intl) and is kept on the profile, because the
// screens are rendered on the server and a server cannot ask the phone
// what day it is.
//
// Here rather than in an entity, because two of them now ask the same
// question: ministry-status builds a month from these parts and
// ministry-day builds a day. A copy in each would be two calendars to
// keep in step — the very thing ADR 0061 refused when it left September
// out of SQL.
//
// Matches the column default in SQL, and both exist for the same reason:
// the app speaks en-GB.
export const DEFAULT_TIME_ZONE = "Europe/London";

// A zone name is only ever validated by trying it. The database checks
// the SHAPE of the string (a check constraint cannot query
// pg_timezone_names), so a well-formed name for a zone this runtime does
// not know can reach us — and formatting a date with an unknown zone
// throws. Everything that reads the column goes through here, so an
// unknown zone costs the default rather than the screen.
export const resolveTimeZone = (value: string | null | undefined): string => {
  if (!value) return DEFAULT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-GB", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TIME_ZONE;
  }
};

export type ZonedDate = {
  year: number;
  month: number;
  day: number;
};

// The year, month and day it is in that zone at that moment. `now` is a
// parameter so tests can stand on a boundary, which is the only moment
// any of this is interesting: at 23:00 UTC on 31 October, London is
// still in October and Kiritimati is already in November, and both are
// right.
export const zonedDate = (
  timeZone: string | null | undefined,
  now: Date = new Date(),
): ZonedDate => {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: resolveTimeZone(timeZone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value;

  const year = value("year");
  const month = value("month");
  const day = value("day");

  // Unreachable with the options above; the fallback keeps the return
  // type honest rather than asserting non-null.
  if (!year || !month || !day) {
    return {
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
      day: now.getUTCDate(),
    };
  }

  return { year: Number(year), month: Number(month), day: Number(day) };
};

// The zone the device itself is in — the authority for a WRITE (ADR
// 0061), where the server only fences a clock that has run away.
//
// Browser only, and only inside an event or an effect: called while
// rendering it would run on the server too, with the server's zone, and
// the two answers differ for a few hours every day — which is exactly
// the hydration mismatch nobody would reproduce.
export const deviceTimeZone = (): string =>
  Intl.DateTimeFormat().resolvedOptions().timeZone;
