import {
  currentMonthKey,
  type EffectiveMinistryStatus,
  SERVICE_YEAR_FIRST_MONTH,
  serviceYearOf,
  toEffectiveMinistryStatus,
  visibleYearGoalHours,
  toMonthKey,
} from "@/entities/ministry-status";
import {
  createServerSupabaseClient,
  queryDeadline,
  SCREEN_UNAVAILABLE,
  type ScreenRead,
} from "@/shared/api";
import { APP_VERSION, hasUnreadVersion } from "@/shared/config";
import { reportReadFailure } from "@/shared/lib/action-failure";
import { resolveTimeZone } from "@/shared/lib/time-zone";

// Everything /profile asks the database, in one place and in the order
// the questions depend on each other. The screen above composes widgets
// and holds no query of its own.
//
// Why here and not in `entities/ministry-status/api`, which would be the
// obvious home: that slice's barrel is imported by the client components
// of the status sheet, and anything that builds a server client carries
// `server-only` with it — the trap ADR 0034 describes, met from the
// other side. A reader placed there fails the build, and passing the
// client in as an argument was rejected by the owner as a workaround
// ("как у меня везде, по одному стилю"). The reads that are a page's own
// orchestration therefore live in the page's api segment, which is a
// normal FSD segment and imports downwards like any other.
// Two outcomes, not one shape with blanks in it — the owner's call on
// 2026-10-23: a failed read must look like /day's, not like data. A
// profile row that did not load used to come back as an empty name,
// which the screen drew as "Your account" next to a real role from the
// token: a page that looks like somebody's profile and is nobody's.
// The shape itself is ScreenRead, the one every screen's read answers
// in, so /day and /profile no longer say the same thing two ways.
export type ProfilePageData = ScreenRead<{
  // Blank when the row exists and the name is not set: the badge then
  // shows nothing rather than a stray letter from a fallback string.
  displayName: string;
  hasUnreadWhatsNew: boolean;
  // Null is THAT read having failed while the profile itself loaded.
  // Nothing about how this person serves is then drawn: "Publisher, no
  // goal" is a statement about them, not a safe fallback for a query
  // that did not answer.
  ministryStatus: EffectiveMinistryStatus | null;
  yearGoalHours: number | null;
  // Was this person already a regular pioneer in the first month of the
  // service year? The sheet's sub-question opens on the answer that is
  // in force, and without this it would always open on "from this
  // month" — so somebody who IS a pioneer since September could open
  // the sheet, change nothing, press Save and silently retract
  // September (ADR 0061, update 2026-10-29).
  pioneeringSinceYearStart: boolean;
  // The calendar the SERVER works this person's months and days out in.
  // Put on the screen because nothing can change it yet (ADR 0061,
  // update 2026-11-07): the column has no write grant, so every profile
  // carries the Europe/London default, and a person whose phone is
  // somewhere else has no way to find that out from inside the app. The
  // row says the value and says it is fixed.
  //
  // Passed through resolveTimeZone rather than raw, so the screen shows
  // what the server actually computes with: a well-formed name this
  // runtime does not know costs the default everywhere else, and a row
  // printing the stored string would then be the one place claiming
  // otherwise.
  timeZone: string;
}>;

const SCOPE = "read-profile-page";

export const readProfilePage = async (): Promise<ProfilePageData> => {
  // Read under the person's own session: the "read own profile" policy
  // (ADR 0043) allows exactly this row, so no id filter is needed.
  const supabase = await createServerSupabaseClient();
  // One budget for all three reads (ADR 0062). They run in sequence —
  // the month comes out of the profile — so a deadline each would add up
  // to three timeouts of skeleton in a row. What they do NOT do is share
  // one signal: that one kept counting while the profile was being read,
  // and a profile that took 4.8s left the two RPCs 200ms, after which
  // the screen rendered as loaded with the status and the goals missing
  // and nothing saying why. `queryDeadline` spends the same budget and
  // keeps a floor for whatever asks last.
  const started = Date.now();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("display_name, whats_new_seen, time_zone")
    .abortSignal(queryDeadline(started))
    .maybeSingle();

  // The row is this screen's subject: without it there is no name, no
  // calendar to ask the month of, and nothing true to put in the header.
  // The two reads below are skipped as well — they would be answers
  // about a person we could not load, and the deadline above is better
  // spent not waiting for them.
  //
  // A missing row is NOT this case: handle_new_user writes one for every
  // account (ADR 0043), so `profile === null` without an error means an
  // account from before that trigger, and the screen can still show the
  // role and the way out. Only an error means "we do not know".
  if (error) {
    reportReadFailure({ scope: SCOPE, step: "profile", error });

    return SCREEN_UNAVAILABLE;
  }

  // Which month this person is in, in their own calendar (ADR 0061). The
  // zone is read from the profile; nothing writes it yet, so it is the
  // Europe/London default for everybody — the cost is named in the ADR,
  // and this line is where it will stop costing anything once there is a
  // screen for changing it.
  const currentMonth = currentMonthKey(profile?.time_zone);
  // September, the month this person's service year began in. The
  // boundary lives here and nowhere else: the database counts twelve
  // months from whatever it is given and knows nothing about September
  // (ADR 0061, decision 1).
  const yearStartsIn = toMonthKey(serviceYearOf(currentMonth), SERVICE_YEAR_FIRST_MONTH);

  // Two questions, two answers, both from the database. Nothing is
  // resolved here: the carry-forward rule and the sum over the year each
  // exist once, in SQL (ADR 0061, decision 5, обновление 2026-10-23).
  // They go together because neither can start before the month is
  // known, and the month comes from the profile above.
  const [status, yearGoal, yearStartStatus] = await Promise.all([
    supabase
      .rpc("ministry_status_for_month", { p_month: currentMonth })
      .abortSignal(queryDeadline(started))
      .maybeSingle(),
    supabase
      .rpc("ministry_status_year_goal", { p_year_start: yearStartsIn })
      .abortSignal(queryDeadline(started)),
    // The same question about September. Only one thing is wanted from
    // it — whether the appointment already covers the start of the
    // year — and it travels with the other two rather than after them,
    // so it costs no round trip of its own.
    supabase
      .rpc("ministry_status_for_month", { p_month: yearStartsIn })
      .abortSignal(queryDeadline(started))
      .maybeSingle(),
  ]);

  // Neither of the two is fatal to the screen — the header and the way
  // out stand without them — but both used to fail in silence, and a
  // profile drawn without the status it could not read looks exactly
  // like a profile of somebody who has no status.
  if (status.error) reportReadFailure({ scope: SCOPE, step: "status", error: status.error });
  if (yearGoal.error) reportReadFailure({ scope: SCOPE, step: "year-goal", error: yearGoal.error });

  const effective = toEffectiveMinistryStatus(status);

  return {
    status: "ready",
    displayName: profile?.display_name ?? "",
    // A profile that did not load is a separate case from unread news
    // and gets no dot: it means the read failed, not that there is
    // something to read. The known cost of keying this to the whole
    // version is in ADR 0057 — a release with nothing worth reading
    // lights the dot as well.
    hasUnreadWhatsNew: profile ? hasUnreadVersion(profile.whats_new_seen, APP_VERSION) : false,
    ministryStatus: effective,
    // The year's figure is a regular pioneer's and nobody else's, even
    // when the sum behind it is above zero because of months already
    // served (the owner, 2026-10-29) — the rule itself is in the entity,
    // with its tests.
    yearGoalHours: yearGoal.error ? null : visibleYearGoalHours(effective?.status, yearGoal.data),
    // A failed read answers "no", which opens the sub-question on "from
    // this month" — the answer that changes the least: it writes the
    // month the person is in and retracts pioneering they have not
    // claimed in the sheet itself.
    pioneeringSinceYearStart: !yearStartStatus.error
      && toEffectiveMinistryStatus(yearStartStatus)?.status === "regular_pioneer",
    timeZone: resolveTimeZone(profile?.time_zone),
  };
};
