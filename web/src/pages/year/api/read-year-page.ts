import { currentDayKey, type DayKey } from "@/entities/ministry-day";
import {
  currentMonthKey,
  isMinistryStatus,
  type MonthKey,
  serviceYearFirstMonth,
  serviceYearOf,
  type ServiceYear,
  visibleYearGoalHours,
} from "@/entities/ministry-status";
import { createServerSupabaseClient, queryDeadline } from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

import { buildYearMonths, type YearMonthRow } from "../model/year-months";
import { serviceYearMonths, serviceYearSpan } from "../model/year-span";
import { readTimeZone } from "./read-time-zone";

// Everything /year asks the database, in one place and all at once.
// Which year is the question comes from the address (ADR 0067, decision
// 1), so nothing here waits on anything else — the zone is read beside
// the totals rather than before them, because it is not needed to form a
// single one of these queries.

// All of the summary or none of it, the reading ADR 0064 settled for the
// day screen's progress block: a bar without its goal is a claim about
// how far through a year somebody is, built from one number we have and
// one we do not.
export type YearSummary = {
  totalMinutes: number;
  // A regular pioneer's figure and nobody else's, for as long as they
  // are one (visibleYearGoalHours, ADR 0061). Null is a real answer and
  // means the card shows the total alone.
  goalHours: number | null;
};

// No ScreenRead wrapper, for the reason read-month-page.ts gives: this
// screen's subject is in the address, so whatever fails the year still
// has a name and the arrows still work. Each block answers for itself.
export type YearPageData = {
  // Null when the zone did not read: "we do not know which year it is
  // now", which kills the arrow forward and silences the pace line.
  currentYear: ServiceYear | null;
  // The month the person is in, for the one question the table asks
  // that the year cannot answer: whether a month has finished, and so
  // whether falling below its goal is a miss or just the middle of it.
  currentMonth: MonthKey | null;
  // The day the person is in, which the pace line needs: it works in
  // months but needs the date to take the share of the current one.
  today: DayKey | null;
  summary: YearSummary | null;
  // Twelve rows, or null when the shape of the table could not be
  // established at all.
  months: YearMonthRow[] | null;
};

const SCOPE = "read-year-page";

// Zero hours is "no goal", not a goal of nothing:
// ministry_status_year_goal answers 0 through its coalesce when no month
// counted, and a bar measured against zero would be full the moment
// anybody served a minute.
const noGoal = (hours: number | null): number | null => (hours === 0 ? null : hours);

export const readYearPage = async (year: ServiceYear): Promise<YearPageData> => {
  const supabase = await createServerSupabaseClient();

  // Worked out before anything is awaited, so the reads below start
  // together: every span comes from the year in the address.
  const started = Date.now();
  const yearStart = serviceYearFirstMonth(year);
  const span = serviceYearSpan(year);
  const months = serviceYearMonths(year);

  const [zone, total, goal, monthly, statuses, closures] = await Promise.all([
    readTimeZone(),
    supabase
      .rpc("ministry_days_total_minutes", { p_from: span.from, p_to: span.to })
      .abortSignal(queryDeadline(started)),
    supabase
      .rpc("ministry_status_year_goal", { p_year_start: yearStart })
      .abortSignal(queryDeadline(started)),
    // The twelve figures, grouped by the database rather than by adding
    // three hundred days up here (ADR 0067, decision 9). A month with
    // nothing recorded is absent from this answer, and that absence is
    // what the table draws a dash for.
    supabase
      .rpc("ministry_days_monthly_minutes", { p_from: span.from, p_to: span.to })
      .abortSignal(queryDeadline(started)),
    // What each month was held to. Separate from the year's goal above
    // on purpose: the rule that only a regular pioneer's months count
    // towards the year stays in that function, so nothing here ever sums
    // these.
    supabase
      .rpc("ministry_status_year_months", { p_year_start: yearStart })
      .abortSignal(queryDeadline(started)),
    // Which of them are closed. Read from the table rather than through
    // a function, like the month screen's own closure read: the grant
    // and the policy are enough, and a row that is there means closed.
    supabase
      .from("ministry_month_closures")
      .select("month")
      .gte("month", months[0])
      .lte("month", months[months.length - 1])
      // Repeats what the policy already does: it costs nothing and keeps
      // the query right on its own terms rather than on the policy's.
      .is("deleted_at", null)
      .abortSignal(queryDeadline(started)),
  ]);

  if (total.error) reportReadFailure({ scope: SCOPE, step: "total", error: total.error });
  if (goal.error) reportReadFailure({ scope: SCOPE, step: "year-goal", error: goal.error });
  if (monthly.error) reportReadFailure({ scope: SCOPE, step: "monthly", error: monthly.error });
  if (statuses.error) reportReadFailure({ scope: SCOPE, step: "statuses", error: statuses.error });
  if (closures.error) {
    reportReadFailure({ scope: SCOPE, step: "closures", error: closures.error });
  }

  // Which status is in force for the month the screen is measured from
  // decides whether the year's figure is this person's at all. The month
  // being lived would be the wrong one to ask on a year gone by, so it
  // is the year's own LAST month: a year is a pioneer's year if it ended
  // as one, and the current year's last month inherits by carry-forward
  // from whatever is in force now.
  const lastMonth = statuses.data?.at(-1);

  const summaryFailed = Boolean(total.error)
    || Boolean(goal.error)
    || Boolean(statuses.error);

  // One reading of the clock, two answers taken from it.
  const currentMonth = zone.status === "ready" ? currentMonthKey(zone.timeZone) : null;

  return {
    currentYear: currentMonth === null ? null : serviceYearOf(currentMonth),
    currentMonth,
    today: zone.status === "ready" ? currentDayKey(zone.timeZone) : null,
    summary: summaryFailed
      ? null
      : {
          totalMinutes: total.data ?? 0,
          goalHours: visibleYearGoalHours(
            // text out of SQL, narrowed rather than asserted: a status
            // this build does not know must read as "not a pioneer"
            // rather than crash the screen, the way the month's reader
            // treats the same answer (ADR 0064).
            isMinistryStatus(lastMonth?.status) ? lastMonth.status : null,
            noGoal(goal.data ?? null),
          ),
        },
    // The table keeps its twelve lines as long as ANY of the three reads
    // answered: a year of dashes with the closures missing is still a
    // true picture of what was recorded, and the month names come from
    // the address. It goes only when the minutes themselves are unknown,
    // because then every figure on it would be a guess.
    months: monthly.error
      ? null
      : buildYearMonths({
          months,
          minutes: monthly.data ?? [],
          statuses: statuses.data ?? [],
          closedMonths: (closures.data ?? []).map((row) => row.month),
        }),
  };
};
