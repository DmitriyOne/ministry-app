import { currentDayKey, type DayKey } from "@/entities/ministry-day";
import {
  createServerSupabaseClient,
  queryDeadline,
  SCREEN_UNAVAILABLE,
  type ScreenRead,
} from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

// Everything /day asks the database, in one place and in the order the
// questions depend on each other. The screen above composes and holds no
// query of its own — the same arrangement /profile has, and here for the
// same reason: the barrel of entities/ministry-day is imported by the
// hours card, a client component, and anything that builds a server
// client carries `server-only` with it (ADR 0034's trap).
// The day itself is known either way — it comes from the calendar, not
// from the table — so it sits outside the tag and the heading is drawn
// whatever happened. Only the hours can be unknown, and "unknown" is not
// zero: zero is a day with nothing on it, while a card opened at zero
// after a failed read would let one tap overwrite hours somebody really
// served. So the unavailable case draws no card at all (ADR 0062).
//
// The zone travels with the hours because the card needs the calendar it
// was drawn in: it is what lets the card notice that midnight has passed
// and stop writing to yesterday.
export type DayPageData = { day: DayKey } & ScreenRead<{
  savedMinutes: number;
  timeZone: string | null;
}>;

const SCOPE = "read-day-page";

export const readDayPage = async (): Promise<DayPageData> => {
  const supabase = await createServerSupabaseClient();
  // One budget for the screen, spent by both reads below — the
  // documented way to stop a request that hangs rather than fails, and
  // the reason this screen cannot sit behind its skeleton for good (ADR
  // 0062).
  const started = Date.now();

  // Read under the person's own session: the "read own profile" policy
  // (ADR 0043) allows exactly this row, so no id filter is needed.
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("time_zone")
    .abortSignal(queryDeadline(started))
    .maybeSingle();

  // The zone is the key of everything below, so a read that FAILED here
  // is not a missing zone — it is an unknown one, and guessing it costs
  // data rather than looks. Europe/London for somebody in Auckland is
  // the previous day for half of their evening: the card would open on
  // yesterday and the first tap would overwrite what yesterday holds.
  // /profile already answered this same error this same way; now both
  // screens do (the owner, 2026-10-26).
  //
  // A missing row is NOT this case: handle_new_user writes one for every
  // account (ADR 0043), so `profile === null` without an error means an
  // account from before that trigger, and the default zone is the right
  // answer for it.
  if (profileError) {
    reportReadFailure({ scope: SCOPE, step: "profile", error: profileError });

    return { day: currentDayKey(null), ...SCREEN_UNAVAILABLE };
  }

  // Which day this person is in, in their own calendar (ADR 0061). The
  // zone is read from the profile; nothing writes it yet, so it is the
  // Europe/London default for everybody — the cost is named in ADR 0061,
  // and this line is where it stops costing anything once there is a
  // screen for changing it.
  const timeZone = profile?.time_zone ?? null;
  const day = currentDayKey(timeZone);

  // After the profile rather than beside it: the day is the key of this
  // query and comes out of the zone above. The waterfall is the same one
  // /profile has, with the same cure (a cookie carrying the zone) and
  // the same reason it waits — ADR 0061.
  const { data: recorded, error } = await supabase
    .from("ministry_days")
    .select("minutes")
    .eq("day", day)
    .abortSignal(queryDeadline(started))
    .maybeSingle();

  if (error) {
    reportReadFailure({ scope: SCOPE, step: "minutes", error });

    return { day, ...SCREEN_UNAVAILABLE };
  }

  return {
    day,
    status: "ready",
    timeZone,
    // No row is zero: nothing has been recorded for that day yet, and
    // the card opens where the day starts.
    savedMinutes: recorded?.minutes ?? 0,
  };
};
