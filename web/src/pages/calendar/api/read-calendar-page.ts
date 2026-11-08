import { currentDayKey, type DayKey } from "@/entities/ministry-day";
import { currentMonthKey, type MonthKey } from "@/entities/ministry-status";
import { createServerSupabaseClient, queryDeadline } from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

import { buildCalendarWeeks, type CalendarWeek } from "../model/calendar-grid";
import { monthSpan } from "../model/month-span";
import { readTimeZone } from "./read-time-zone";

// Everything /calendar asks the database, in one place and both at once.
// Which month is the question comes from the address (ADR 0069), so
// neither read waits on the other: the zone is read beside the days
// rather than before them, because it is not needed to form the query.
//
// Two reads, which is the whole cost of this screen: no new SQL arrived
// with it. The days are the same rows the month screen selects, over the
// same span.
export type CalendarPageData = {
  // Null when the zone did not read: "we do not know which month it is
  // now", which kills the arrow forward and leaves no square marked as
  // today.
  currentMonth: MonthKey | null;
  today: DayKey | null;
  // Null when the days did not read. The grid is not drawn half-empty in
  // that case: a square with no dot says "nothing recorded here", and
  // saying that about a month we failed to read would be a lie told
  // thirty times.
  weeks: CalendarWeek[] | null;
};

const SCOPE = "read-calendar-page";

export const readCalendarPage = async (month: MonthKey): Promise<CalendarPageData> => {
  const supabase = await createServerSupabaseClient();

  // Worked out before anything is awaited, so both reads start together.
  const started = Date.now();
  const span = monthSpan(month);

  const [zone, rows] = await Promise.all([
    readTimeZone(),
    // Read from the table rather than through a function, as the month
    // screen does: ministry_days grants select to authenticated and its
    // policy scopes the rows to the caller, so there is nothing for a
    // function to add — and the primary key (user_id, day) is the index
    // for exactly this shape, equality on the person with a range on the
    // day.
    supabase
      .from("ministry_days")
      .select("day, minutes")
      .gte("day", span.from)
      .lte("day", span.to)
      .is("deleted_at", null)
      .abortSignal(queryDeadline(started)),
  ]);

  if (rows.error) reportReadFailure({ scope: SCOPE, step: "days", error: rows.error });

  const timeZone = zone.status === "ready" ? zone.timeZone : null;

  return {
    currentMonth: timeZone === null ? null : currentMonthKey(timeZone),
    today: timeZone === null ? null : currentDayKey(timeZone),
    weeks: rows.error ? null : buildCalendarWeeks(month, rows.data ?? []),
  };
};
