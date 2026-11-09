import { addDays, type DayKey } from "@/entities/ministry-day";

import { monthOfDay, monthSpanOf } from "./progress-span";

// Which days the strip holds, now that it scrolls (ADR 0065, update
// 2026-11-09). Until then it was exactly seven: six read from the
// database and the open day, and nothing else existed.
//
// The strip now reaches back without a limit, a chunk at a time, and
// forward to the end of the open day's month. These are the two numbers
// that decide how big each read is.
//
// FORTY-FIVE back on the first read, which is a month and a half: enough
// that the first flick has somewhere to go, small enough that the screen
// is not paying for days nobody will look at. The step is the same
// number for the same reason — the person who scrolls once usually
// scrolls again.
export const LAST_DAYS_BACK = 45;
export const LAST_DAYS_STEP = 45;

// How many chips the skeleton draws while the days are read. Not how
// many the strip holds any more — that is a span now — but how many fit
// across the screen the app is built for, which is what the waiting
// state has to look like.
export const LAST_DAYS_SKELETON_CHIPS = 7;

export type StripDay = {
  day: DayKey;
  // Null is "nothing is known about that day" — no row — and it is the
  // dash on screen. Zero is a day somebody recorded as nothing, and it
  // prints as 0:00. The table keeps them apart (ADR 0062) and so does
  // this, because the difference is the whole point of the strip: a gap
  // is a day to go back and fill in.
  minutes: number | null;
};

export type DaySpan = {
  // Both ends included, which is what the read takes.
  from: DayKey;
  to: DayKey;
};

// What the screen reads with everything else it reads.
//
// The far end is the last day of the OPEN day's month, and that is the
// owner's rule said in full: forward to the end of the month the open
// day sits in, never past the end of the month the person is in. The
// second half needs no code — /day answers 404 for a day that has not
// happened, so the open day is never in a month after this one, and the
// first half is then always the stricter of the two.
//
// It deliberately does not depend on which day today is: today comes
// from the person's time zone, and waiting for that read is the
// waterfall ADR 0064 took apart. Days after today simply hold no rows,
// so asking for them costs an empty answer and nothing else. WHICH of
// them are still to come is a question for the render, where today is
// known (visibleDays, isFutureDay below).
export const lastDaysSpan = (openDay: DayKey): DaySpan => ({
  from: addDays(openDay, -LAST_DAYS_BACK),
  to: monthSpanOf(monthOfDay(openDay)).to,
});

// The next chunk back, asked for when the person reaches the left edge.
// It ends the day before the oldest chip already on the strip, so the
// two pieces meet without a gap and without an overlap.
export const olderDaysSpan = (oldest: DayKey): DaySpan => ({
  from: addDays(oldest, -LAST_DAYS_STEP),
  to: addDays(oldest, -1),
});

// Sparse rows in, a dense strip out: the database answers only for days
// it holds, and the strip has a chip for every day either way.
//
// Oldest first, so the row reads left to right into the open day, which
// is where the card above it is and where the forward arrow points.
//
// The open day is IN this list, and its minutes are the one value in it
// nothing reads: the chip takes its number from the hours provider, so
// that it and the card cannot disagree after a tap (ADR 0065). Leaving
// the day out instead would make the list a row with a hole in the
// middle of it, which every caller would then have to put back.
export const stripDays = ({ from, to }: DaySpan, rows: { day: string; minutes: number }[]) => {
  const recorded = new Map(rows.map(({ day, minutes }) => [day, minutes]));
  const days: StripDay[] = [];

  // ISO dates compare as text in date order, which is the whole reason
  // the key has this shape — so the loop needs no arithmetic on the
  // ends and no count of the days between them.
  for (let day = from; day <= to; day = addDays(day, 1)) {
    days.push({ day, minutes: recorded.get(day) ?? null });
  }

  return days;
};

// A day nobody has lived yet: it gets a chip, because the strip runs to
// the end of the month, but it is not a link and not an invitation.
//
// Today unknown — the zone read failed — answers false, and that is the
// safe half of the pair: paired with visibleDays below, which then shows
// nothing past the open day at all, no chip is ever drawn that we cannot
// say the truth about. Guessing the other way would grey out a day the
// person has already served.
export const isFutureDay = (day: DayKey, today: DayKey | null): boolean =>
  today !== null && day > today;

// What the strip may show. With today known, all of it: the days to come
// are drawn and dimmed. Without it, nothing past the open day — the
// strip then ends where it has always ended, on the right, and says
// nothing it cannot stand behind.
export const visibleDays = (
  days: StripDay[],
  openDay: DayKey,
  today: DayKey | null,
): StripDay[] => (today === null ? days.filter(({ day }) => day <= openDay) : days);
