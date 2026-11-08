import { cache } from "react";

import {
  createServerSupabaseClient,
  queryDeadline,
  SCREEN_UNAVAILABLE,
  type ScreenRead,
} from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

// The calendar this person lives in, read once per request however many
// times it is asked for — the bare /year needs it to know which service
// year to send somebody to, and the year screen needs it to know whether
// the arrow forward is live and where the pace line stands.
//
// A third copy, after pages/day's and pages/month's, and for the reason
// written out in both: two slices of the same layer may not import each
// other (FSD), and the alternative — a shared reader in `entities` — is
// the trap ADR 0034 describes met from the other side, because that
// barrel is imported by client components and a server client carries
// `server-only` with it.
export type TimeZoneRead = ScreenRead<{ timeZone: string | null }>;

const SCOPE = "read-year-page";

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
  // Nothing is written on this screen, so the cost is the smallest of
  // the three: the arrow forward goes dead and the pace line says
  // nothing, rather than either of them answering on a guess.
  if (error) {
    reportReadFailure({ scope: SCOPE, step: "profile", error });

    return SCREEN_UNAVAILABLE;
  }

  return { status: "ready", timeZone: data?.time_zone ?? null };
});
