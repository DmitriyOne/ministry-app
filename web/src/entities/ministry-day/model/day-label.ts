import { addDays, type DayKey } from "./day-key";

// How a day is named in a heading, and which parts of that the domain
// decides rather than the screen.
//
// The two nearest days get words, because "Tuesday" does not answer the
// question a person opening this screen has — is this the day I am in?
// — and a date alone answers it even less. Everything further back is
// its weekday: that is how ministry gets remembered ("we went out on
// the Saturday"), and the date underneath carries the precision.
export type DayHeading
  = { kind: "today" }
    | { kind: "yesterday" }
    | { kind: "weekday"; weekday: string };

// Built once, at module load. `Intl.DateTimeFormat` is expensive to
// construct and these three never vary — the app has one locale (ADR
// 0014/0023), and the zone below is not a choice.
//
// The locale is written out rather than imported from shared/config,
// which is what shared/lib/time-zone already does and for the same two
// reasons. `@/shared/config` is a barrel that drags in `env.ts`, so a
// unit test of this file would fail on missing environment variables
// before reaching an assertion; and reaching past the barrel for
// `locale` alone is a public-API sidestep steiger refuses (measured,
// 2026-10-27 — FSD rules are not switched off here, see CLAUDE.md). If
// this app ever gains a second language, these two modules are where to
// look.
//
// UTC, deliberately and in all three: a DayKey names a calendar day and
// carries no zone of its own, so formatting it in the server's zone
// would print the day before for anybody west of it. The key is read as
// UTC midnight and formatted as UTC, which makes "2026-06-02" print as
// 2 June everywhere this runs.
const WEEKDAY = new Intl.DateTimeFormat("en-GB", { weekday: "long", timeZone: "UTC" });
const DATE = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
const DATE_WITH_YEAR = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const asUtcDate = (day: DayKey): Date => new Date(`${day}T00:00:00Z`);

const yearOf = (day: DayKey): string => day.slice(0, 4);

// The words are not here: "Today" and "Yesterday" are interface text and
// belong to the dictionary, so this says WHICH word and the screen says
// it (ADR 0014). A weekday is not interface text — it is formatted data,
// like the date beside it.
export const dayHeading = (day: DayKey, today: DayKey): DayHeading => {
  if (day === today) return { kind: "today" };

  if (day === addDays(today, -1)) return { kind: "yesterday" };

  return { kind: "weekday", weekday: WEEKDAY.format(asUtcDate(day)) };
};

// The year appears only when it is not the year we are in. On most days
// it is noise; on a day eighteen months back it is the whole point, and
// a heading that says "2 June" for both is the one that misleads.
export const formatDayDate = (day: DayKey, today: DayKey): string =>
  (yearOf(day) === yearOf(today) ? DATE : DATE_WITH_YEAR).format(asUtcDate(day));

// The same day as two short parts: the weekday and the date, for a
// chip in a row of them (the last-days strip on /day, ADR 0065).
//
// Here and not in pages/day, where its only caller is, because this is
// the third way this app names a DayKey and the other two are already
// here: a formatter living beside the screen that wants it would be the
// mistake three copies of MINUTES_IN_HOUR were (ADR 0064, decision 13).
// The zone argument the others take is absent on purpose — a chip says
// WHICH day it is, never "today", so nothing here depends on today.
//
// One function returning both parts rather than two formatters: the
// caller always wants the pair, and the chip is the only shape they are
// used in.
//
// `weekday: "short"` ("Wed"), not "narrow": narrow gives one letter, and
// in English Tuesday and Thursday are both "T" — a strip of seven where
// two cannot be told apart. Three letters fit the column at 390px,
// which is the width this app is built for.
const WEEKDAY_SHORT = new Intl.DateTimeFormat("en-GB", { weekday: "short", timeZone: "UTC" });
const DAY_OF_MONTH = new Intl.DateTimeFormat("en-GB", { day: "numeric", timeZone: "UTC" });

export type ShortDayLabel = { weekday: string; dayOfMonth: string };

export const shortDayLabel = (day: DayKey): ShortDayLabel => {
  const date = asUtcDate(day);

  return { weekday: WEEKDAY_SHORT.format(date), dayOfMonth: DAY_OF_MONTH.format(date) };
};
