import {
  currentMonthKey,
  type EffectiveMinistryStatus,
  SERVICE_YEAR_FIRST_MONTH,
  serviceYearOf,
  toEffectiveMinistryStatus,
  toMonthKey,
} from "@/entities/ministry-status";
import { createServerSupabaseClient } from "@/shared/api";
import { APP_VERSION, hasUnreadVersion } from "@/shared/config";

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
export type ProfilePageData = {
  // Empty when the read failed or the name is blank: the badge then
  // shows nothing rather than a stray letter from a fallback string.
  displayName: string;
  hasUnreadWhatsNew: boolean;
  // Null is the read having failed. Nothing about how this person serves
  // is then drawn: "Publisher, no goal" is a statement about them, not a
  // safe fallback for a query that did not answer.
  ministryStatus: EffectiveMinistryStatus | null;
  yearGoalHours: number | null;
};

export const readProfilePage = async (): Promise<ProfilePageData> => {
  // Read under the person's own session: the "read own profile" policy
  // (ADR 0043) allows exactly this row, so no id filter is needed. A
  // failed read leaves the name out rather than failing the screen — the
  // role and the way out are the parts that matter here.
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, whats_new_seen, time_zone")
    .maybeSingle();

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
  const [status, yearGoal] = await Promise.all([
    supabase.rpc("ministry_status_for_month", { p_month: currentMonth }).maybeSingle(),
    supabase.rpc("ministry_status_year_goal", { p_year_start: yearStartsIn }),
  ]);

  return {
    displayName: profile?.display_name ?? "",
    // A profile that did not load is a separate case from unread news
    // and gets no dot: it means the read failed, not that there is
    // something to read. The known cost of keying this to the whole
    // version is in ADR 0057 — a release with nothing worth reading
    // lights the dot as well.
    hasUnreadWhatsNew: profile ? hasUnreadVersion(profile.whats_new_seen, APP_VERSION) : false,
    ministryStatus: toEffectiveMinistryStatus(status),
    yearGoalHours: yearGoal.error ? null : yearGoal.data,
  };
};
