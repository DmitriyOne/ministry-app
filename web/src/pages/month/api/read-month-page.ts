import { currentDayKey, type DayKey } from "@/entities/ministry-day";
import {
  currentMonthKey,
  type MonthKey,
  SERVICE_YEAR_FIRST_MONTH,
  serviceYearOf,
  toEffectiveMinistryStatus,
  toMonthKey,
  visibleYearGoalHours,
} from "@/entities/ministry-status";
import { createServerSupabaseClient, queryDeadline } from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

import { buildMonthDays, type MonthDayRow } from "../model/month-days";
import { monthSpan, twelveMonthSpan } from "../model/month-span";
import { readTimeZone } from "./read-time-zone";

// Everything /month asks the database, in one place and all at once.
// Which month is the question comes from the address (ADR 0066, the same
// rule as the day's), so nothing here waits on anything else — the zone
// is read beside the totals rather than before them, because it is not
// needed to form a single one of these queries.
//
// What the zone IS needed for is the two questions the screen asks about
// time: is this month over, and is the arrow forward live. Both are
// answered after the reads, from a value that may be unknown.

// All of the summary or none of it. A bar without its goal, or a total
// without the bar beside it, is a claim about how far through a month
// somebody is built from one number we have and one we do not — the
// reading ADR 0064 settled for the day screen's progress block.
export type MonthSummary = {
  totalMinutes: number;
  // Null is "no goal", a real answer: a publisher who set none. Zero is
  // the same answer arriving from SQL's coalesce and is normalised to
  // null, so the screen draws one case rather than two.
  monthGoalHours: number | null;
  yearMinutes: number;
  // A regular pioneer's figure and nobody else's, for as long as they
  // are one (visibleYearGoalHours, ADR 0061).
  yearGoalHours: number | null;
};

// No ScreenRead wrapper, deliberately: on /day and /profile there is a
// read without which the screen cannot exist at all — the zone that
// names the day, the profile row that is the subject. This screen's
// subject is in the address. Whatever fails, the month still has a name
// and the arrows still work, so there is no "unavailable" state to
// declare; each block answers for itself.
export type MonthPageData = {
  // Null when the zone did not read: "we do not know which month it is
  // now", which hides the closing button and the arrow forward.
  currentMonth: MonthKey | null;
  // The day the person is in, for the pace line in the summary: it needs
  // the date, not just the month, and asking the same zone twice is
  // cheaper than carrying the zone into a pure function. Null for the
  // same reason currentMonth is.
  today: DayKey | null;
  summary: MonthSummary | null;
  days: MonthDayRow[] | null;
  // When this month was closed, as the database holds it, or null for a
  // month that is open. The instant rather than a boolean, because the
  // notice names the day — and the zone below is what takes it apart in
  // the person's own calendar rather than the server's.
  closedAt: string | null;
  timeZone: string | null;
};

const SCOPE = "read-month-page";

// Zero hours is "no goal", not a goal of nothing: ministry_status_year_
// goal answers 0 through its coalesce when no month counted, and a bar
// measured against zero would be full the moment anybody served a
// minute.
const noGoal = (hours: number | null): number | null => (hours === 0 ? null : hours);

export const readMonthPage = async (month: MonthKey): Promise<MonthPageData> => {
  const supabase = await createServerSupabaseClient();

  // Worked out before anything is awaited, so the reads below start
  // together: every span comes from the month in the address.
  const started = Date.now();
  const yearStart = toMonthKey(serviceYearOf(month), SERVICE_YEAR_FIRST_MONTH);
  const days = monthSpan(month);
  const year = twelveMonthSpan(yearStart);

  const [zone, total, yearTotal, status, yearGoal, rows, closure] = await Promise.all([
    readTimeZone(),
    supabase
      .rpc("ministry_days_total_minutes", { p_from: days.from, p_to: days.to })
      .abortSignal(queryDeadline(started)),
    supabase
      .rpc("ministry_days_total_minutes", { p_from: year.from, p_to: year.to })
      .abortSignal(queryDeadline(started)),
    // The month's goal comes with its status, by the carry-forward rule
    // that lives in SQL: this month may have no row of its own and
    // inherit from an earlier one.
    supabase
      .rpc("ministry_status_for_month", { p_month: month })
      .abortSignal(queryDeadline(started))
      .maybeSingle(),
    supabase
      .rpc("ministry_status_year_goal", { p_year_start: yearStart })
      .abortSignal(queryDeadline(started)),
    // The days themselves, read from the table rather than through a
    // function: ministry_days grants select to authenticated and its
    // policy scopes the rows to the caller, so there is nothing for a
    // function to add — and the primary key (user_id, day) is the index
    // for exactly this shape, equality on the person with a range on the
    // day. No order and no limit: at most thirty-one rows, and the order
    // is put on them by buildMonthDays, which has to sort anyway.
    supabase
      .from("ministry_days")
      .select("day, minutes")
      .gte("day", days.from)
      .lte("day", days.to)
      .is("deleted_at", null)
      .abortSignal(queryDeadline(started)),
    // Closed or not. A row that is there means closed; the policy
    // already hides a reopened one.
    supabase
      .from("ministry_month_closures")
      .select("closed_at")
      .eq("month", month)
      // Repeats what the policy already does, the way the day strip's
      // read does: it costs nothing and keeps the query right on its own
      // terms rather than on the policy's.
      .is("deleted_at", null)
      .abortSignal(queryDeadline(started))
      .maybeSingle(),
  ]);

  if (total.error) reportReadFailure({ scope: SCOPE, step: "total", error: total.error });
  if (yearTotal.error) {
    reportReadFailure({ scope: SCOPE, step: "year-total", error: yearTotal.error });
  }
  if (status.error) reportReadFailure({ scope: SCOPE, step: "status", error: status.error });
  if (yearGoal.error) reportReadFailure({ scope: SCOPE, step: "year-goal", error: yearGoal.error });
  if (rows.error) reportReadFailure({ scope: SCOPE, step: "days", error: rows.error });
  if (closure.error) reportReadFailure({ scope: SCOPE, step: "closure", error: closure.error });

  const effective = toEffectiveMinistryStatus(status);

  // A status this build does not know is not an error anybody raised —
  // PostgREST answers 200 — so without this line the summary would
  // vanish from somebody's screen with nothing anywhere to say why. The
  // one way it happens is a deploy that went out in the wrong order
  // (ADR 0064).
  if (!status.error && !effective) {
    reportReadFailure({
      scope: SCOPE,
      step: "status",
      error: new Error("ministry status outside this build's catalogue"),
    });
  }

  const summaryFailed = Boolean(total.error)
    || Boolean(yearTotal.error)
    || Boolean(yearGoal.error)
    || !effective;

  return {
    currentMonth: zone.status === "ready" ? currentMonthKey(zone.timeZone) : null,
    today: zone.status === "ready" ? currentDayKey(zone.timeZone) : null,
    summary: summaryFailed
      ? null
      : {
          totalMinutes: total.data ?? 0,
          monthGoalHours: noGoal(effective?.monthlyGoalHours ?? null),
          yearMinutes: yearTotal.data ?? 0,
          yearGoalHours: visibleYearGoalHours(effective?.status, yearGoal.data),
        },
    days: rows.error ? null : buildMonthDays(rows.data ?? []),
    // A closure we could not read answers "open". The screen then offers
    // to close a month that may already be closed, and the database
    // answers that honestly — which is better than hiding the way out of
    // a month nobody can prove is shut.
    closedAt: closure.error ? null : closure.data?.closed_at ?? null,
    timeZone: zone.status === "ready" ? zone.timeZone : null,
  };
};
