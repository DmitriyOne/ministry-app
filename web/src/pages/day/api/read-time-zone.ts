import { cache } from "react";

import {
  createServerSupabaseClient,
  queryDeadline,
  SCREEN_UNAVAILABLE,
  type ScreenRead,
} from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

// The calendar this person lives in, read once per request however many
// times it is asked for.
//
// `cache()` is not an optimisation here, it is the difference between one
// round trip and two: the heading names the day, so generateMetadata
// needs the zone as well as the screen does, and the two run as separate
// calls in the same request (the documented React/Next pattern for
// exactly this). Nothing is passed in for the same reason — an argument
// would become part of the cache key, and a timestamp differing by a
// millisecond between the two callers would read the profile twice.
//
// Not merged into readDayPage: that one needs the day, this one does
// not, and the metadata has no business asking for a day's minutes.
export type TimeZoneRead = ScreenRead<{ timeZone: string | null }>;

const SCOPE = "read-day-page";

export const readTimeZone = cache(async (): Promise<TimeZoneRead> => {
  const supabase = await createServerSupabaseClient();

  // Read under the person's own session: the "read own profile" policy
  // (ADR 0043) allows exactly this row, so no id filter is needed.
  const { data, error } = await supabase
    .from("profiles")
    .select("time_zone")
    .abortSignal(queryDeadline(Date.now()))
    .maybeSingle();

  // A zone we could not read is not a missing zone — it is an unknown
  // one, and guessing costs data rather than looks: Europe/London for
  // somebody in Auckland is the previous day for half of their evening,
  // and the screen would open on, and write to, the wrong day.
  //
  // A missing ROW is not this case: handle_new_user writes one for every
  // account (ADR 0043), so `data === null` without an error means an
  // account from before that trigger, and the default zone is right for
  // it.
  if (error) {
    reportReadFailure({ scope: SCOPE, step: "profile", error });

    return SCREEN_UNAVAILABLE;
  }

  return { status: "ready", timeZone: data?.time_zone ?? null };
});
