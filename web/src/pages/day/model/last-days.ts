import { addDays, type DayKey } from "@/entities/ministry-day";

// The days behind the open one, and how many of them the strip holds.
//
// SIX, not seven: the seventh chip is the open day itself, and its
// number does not come from the database at all — it comes from the
// hours provider, so that the chip and the card never disagree about the
// day the person is dialling (ADR 0065). Reading it here as well would
// be the second authority on one number, and the one further from the
// finger is the one that would be stale.
//
// The span and the list are in the same module because both say "six
// days back", and the read and the render are two different files: a
// constant in each is how the strip ends up asking for one range and
// drawing another.
const PREVIOUS_DAYS = 6;

export type PreviousDay = {
  day: DayKey;
  // Null is "nothing is known about that day" — no row — and it is the
  // dash on screen. Zero is a day somebody recorded as nothing, and it
  // prints as 0:00. The table keeps them apart (ADR 0062) and so does
  // this, because on a strip of seven the difference is the whole
  // point: a gap is a day to go back and fill in.
  minutes: number | null;
};

export const previousDaysSpan = (openDay: DayKey): { from: DayKey; to: DayKey } => ({
  from: addDays(openDay, -PREVIOUS_DAYS),
  to: addDays(openDay, -1),
});

// Sparse rows in, a dense strip out: the database answers only for days
// it holds, and the strip has a chip for every day either way.
//
// Oldest first, so the row reads left to right into the open day on the
// right — which is where the card above it is, and where the forward
// arrow in the heading points.
export const previousDays = (
  openDay: DayKey,
  rows: { day: string; minutes: number }[],
): PreviousDay[] => {
  const recorded = new Map(rows.map(({ day, minutes }) => [day, minutes]));

  return Array.from({ length: PREVIOUS_DAYS }, (_, index) => {
    const day = addDays(openDay, index - PREVIOUS_DAYS);

    return { day, minutes: recorded.get(day) ?? null };
  });
};
