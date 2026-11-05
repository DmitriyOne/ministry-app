import { cache } from "react";

import {
  createServerSupabaseClient,
  queryDeadline,
  SCREEN_UNAVAILABLE,
  type ScreenRead,
} from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

// The calendar this person lives in, read once per request however many
// times it is asked for — the bare /month needs it to know which month
// to send somebody to, and the month screen needs it to know whether the
// month it is showing is over.
//
// A copy of pages/day's reader rather than an import of it: two slices
// of the same layer may not import each other (FSD), and the alternative
// — a shared reader in `entities` — is the trap ADR 0034 describes, met
// from the other side: that barrel is imported by client components, and
// a server client carries `server-only` with it.
export type TimeZoneRead = ScreenRead<{ timeZone: string | null }>;

const SCOPE = "read-month-page";

export const readTimeZone = cache(async (): Promise<TimeZoneRead> => {
  const supabase = await createServerSupabaseClient();

  // Read under the person's own session: the "read own profile" policy
  // (ADR 0043) allows exactly this row, so no id filter is needed.
  const { data, error } = await supabase
    .from("profiles")
    .select("time_zone")
    .abortSignal(queryDeadline(Date.now()))
    .maybeSingle();

  // A zone we could not read is not a missing zone but an unknown one.
  // On this screen the cost is smaller than on /day — nothing is written
  // here — but it is the same cost: guessing would say a month is over
  // when it is not, and offer to close the month somebody is standing
  // in.
  if (error) {
    reportReadFailure({ scope: SCOPE, step: "profile", error });

    return SCREEN_UNAVAILABLE;
  }

  return { status: "ready", timeZone: data?.time_zone ?? null };
});
