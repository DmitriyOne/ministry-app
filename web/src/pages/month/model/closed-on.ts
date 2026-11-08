import { DEFAULT_TIME_ZONE } from "@/shared/lib/time-zone";

// When the month was closed, in the person's own calendar: "1 July".
//
// The column exists for this and nothing else (`closed_at`, kept apart
// from `created_at` so that a month closed, reopened and closed again
// names the last closure). Without reading it the notice could only say
// "Closed", which is the one thing the screen already shows by having
// the notice at all.
//
// The zone matters here as it does everywhere: the row carries an
// instant, and an instant taken apart in the server's calendar names
// the previous day for anybody west of it. A zone we could not read
// falls back to the default — the cost is a date a few hours out in a
// sentence, with nothing written against it.
//
// Null for anything that is not a timestamp. The value comes from the
// database, so that is not a thing that happens; it is checked because
// the alternative is "Invalid Date" in a sentence on somebody's phone.
export const formatClosedOn = (
  closedAt: string,
  timeZone: string | null,
): string | null => {
  const at = new Date(closedAt);

  if (Number.isNaN(at.getTime())) return null;

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    timeZone: timeZone ?? DEFAULT_TIME_ZONE,
  }).format(at);
};
