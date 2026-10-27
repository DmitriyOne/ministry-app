import type { DayKey } from "@/entities/ministry-day";
import {
  createServerSupabaseClient,
  queryDeadline,
  SCREEN_UNAVAILABLE,
  type ScreenRead,
} from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

import { readTimeZone } from "./read-time-zone";

// Everything /day asks the database, in one place. The screen above
// composes and holds no query of its own — the same arrangement
// /profile has, and here for the same reason: the barrel of
// entities/ministry-day is imported by the hours card, a client
// component, and anything that builds a server client carries
// `server-only` with it (ADR 0034's trap).
//
// The day is NOT read here any more: it is in the address (ADR 0063),
// which is what lets these two reads run side by side. They used to be a
// waterfall — the zone named the day, the day keyed the minutes — and
// that waterfall is the debt ADR 0061 recorded for both /day and
// /profile. Here it is simply gone: the minutes are keyed by a day we
// were handed, and the zone is only needed to name it in the heading.
//
// "Unknown" is still not zero. Zero is a day with nothing on it, while a
// card opened at zero after a failed read would let one tap overwrite
// hours somebody really served — so an unavailable read draws no card at
// all (ADR 0062).
export type DayPageData = ScreenRead<{
  savedMinutes: number;
  timeZone: string | null;
}>;

const SCOPE = "read-day-page";

export const readDayPage = async (day: DayKey): Promise<DayPageData> => {
  const supabase = await createServerSupabaseClient();

  const [zone, recorded] = await Promise.all([
    readTimeZone(),
    supabase
      .from("ministry_days")
      .select("minutes")
      .eq("day", day)
      .abortSignal(queryDeadline(Date.now()))
      .maybeSingle(),
  ]);

  // Each read gets the full budget rather than sharing one countdown,
  // which is right now that they are parallel: the screen is still
  // bounded by five seconds in total, and nobody is left with the
  // remainder of somebody else's wait (the floor queryDeadline keeps
  // exists for the sequential case /profile still has).
  if (zone.status === "unavailable") return SCREEN_UNAVAILABLE;

  if (recorded.error) {
    reportReadFailure({ scope: SCOPE, step: "minutes", error: recorded.error });

    return SCREEN_UNAVAILABLE;
  }

  return {
    status: "ready",
    timeZone: zone.timeZone,
    // No row is zero: nothing has been recorded for that day yet, and
    // the card opens where the day starts.
    savedMinutes: recorded.data?.minutes ?? 0,
  };
};
