import type { DayKey } from "@/entities/ministry-day";
import {
  type MonthKey,
  toEffectiveMinistryStatus,
  visibleYearGoalHours,
} from "@/entities/ministry-status";
import {
  createServerSupabaseClient,
  queryDeadline,
  SCREEN_UNAVAILABLE,
  type ScreenRead,
} from "@/shared/api";
import { reportReadFailure } from "@/shared/lib/action-failure";

import { type DaySpan, lastDaysSpan, type StripDay, stripDays } from "../model/last-days";
import {
  monthOfDay,
  monthSpanOf,
  serviceYearSpanOf,
  serviceYearStartOf,
} from "../model/progress-span";
import { readTimeZone } from "./read-time-zone";

// Everything /day asks the database, in one place. The screen above
// composes and holds no query of its own — the same arrangement
// /profile has, and here for the same reason: the barrel of
// entities/ministry-day is imported by the hours card, a client
// component, and anything that builds a server client carries
// `server-only` with it (ADR 0034's trap).
//
// The day is NOT read here any more: it is in the address (ADR 0063),
// which is what lets these reads run side by side. They used to be a
// waterfall — the zone named the day, the day keyed the minutes — and
// that waterfall is the debt ADR 0061 recorded for both /day and
// /profile. Here it is simply gone: the minutes are keyed by a day we
// were handed, and the zone is only needed to name it in the heading.
// The progress reads join them rather than queueing behind them for the
// same reason: the month they count is the open day's month, not the
// month the phone is in (ADR 0064).
//
// "Unknown" is still not zero. Zero is a day with nothing on it, while a
// card opened at zero after a failed read would let one tap overwrite
// hours somebody really served — so an unavailable read draws no card at
// all (ADR 0062).

// What the progress block is drawn from. Null for the whole of it rather
// than a shape with holes: a bar without its goal, or a goal without the
// total beside it, would be a claim about how far through a month
// somebody is, made out of one number we have and one we do not (ADR
// 0064, decision 4).
export type DayProgress = {
  month: MonthKey;
  monthMinutes: number;
  // Null is "no goal", which is a real answer here: a publisher who has
  // set none, and the service year's goal, which only a regular pioneer
  // has at all (ADR 0061). The block then shows the total and no bar.
  //
  // ZERO is that same answer, not a goal of none: ministry_status_year_
  // _goal returns 0 when no month of the year counted (its `coalesce`),
  // and a bar measured against it would be full the moment anybody
  // served a minute. It is normalised away below, so the block has one
  // case to draw rather than two — /profile makes the same reading with
  // a dash (widgets/ministry-goals).
  monthGoalHours: number | null;
  yearMinutes: number;
  yearGoalHours: number | null;
};

export type DayPageData = ScreenRead<{
  savedMinutes: number;
  timeZone: string | null;
  progress: DayProgress | null;
  // The strip's window — a month and a half behind the open day and on
  // to the end of its month — or null when that read failed. The same
  // all-or-nothing rule the progress block follows: a strip with a chip
  // missing would say "nothing recorded" about a day that may hold
  // hours, and that is the one thing it must never say, because it is
  // read as "go back and fill this in".
  //
  // The strip reaches further back than this as the person scrolls, a
  // chunk at a time, and those chunks come from the action beside this
  // file (read-older-days-action.ts).
  lastDays: StripDay[] | null;
  // The month this day belongs to has been reported and shut (ADR
  // 0066): the card shows what it holds and nothing may be dialled.
  isMonthClosed: boolean;
}>;

const SCOPE = "read-day-page";

export const readDayPage = async (day: DayKey): Promise<DayPageData> => {
  const supabase = await createServerSupabaseClient();

  // Worked out before anything is awaited: the spans come from the
  // address, so they cost no round trip and the six reads below start
  // together.
  const started = Date.now();
  const month = monthOfDay(day);
  const yearStart = serviceYearStartOf(month);
  const monthSpan = monthSpanOf(month);
  const yearSpan = serviceYearSpanOf(yearStart);
  const stripSpan = lastDaysSpan(day);

  const [zone, recorded, monthTotal, yearTotal, status, yearGoal, strip, closure]
    = await Promise.all([
      readTimeZone(),
      supabase
        .from("ministry_days")
        .select("minutes")
        .eq("day", day)
        .abortSignal(queryDeadline(started))
        .maybeSingle(),
      // The totals are sums the database computes, not sums of rows we
      // fetch: a total built in the browser would be a second authority on
      // the same number, and the one in the browser is the one that can be
      // wrong (ADR 0062, обновление). The boundaries are ours, because
      // September is the app's rule and SQL knows nothing about it.
      supabase
        .rpc("ministry_days_total_minutes", { p_from: monthSpan.from, p_to: monthSpan.to })
        .abortSignal(queryDeadline(started)),
      supabase
        .rpc("ministry_days_total_minutes", { p_from: yearSpan.from, p_to: yearSpan.to })
        .abortSignal(queryDeadline(started)),
      // The month's goal comes with its status, by the carry-forward rule
      // that lives in SQL: the open month may have no row of its own and
      // inherit from an earlier one.
      supabase
        .rpc("ministry_status_for_month", { p_month: month })
        .abortSignal(queryDeadline(started))
        .maybeSingle(),
      supabase
        .rpc("ministry_status_year_goal", { p_year_start: yearStart })
        .abortSignal(queryDeadline(started)),
      // The strip's own rows, read from the table rather than through a
      // function: `ministry_days` grants select to authenticated and its
      // policy scopes the rows to the caller, so there is nothing for a
      // function to add — and the primary key (user_id, day) is the index
      // for exactly this, equality on the person with a range on the day.
      // The filter on deleted_at repeats what the policy already does,
      // the way ministry_days_total_minutes repeats its own conditions:
      // it costs nothing and keeps the query right on its own terms.
      //
      // Seventy-five rows at the very most — a month and a half back
      // plus a month forward, and the days ahead hold none — so no
      // order and no limit: the strip is built from the days, not from
      // the order they arrive in, and the span is nowhere near the
      // thousand rows PostgREST would silently cut at (ADR 0038/0058).
      supabase
        .from("ministry_days")
        .select("day, minutes")
        .gte("day", stripSpan.from)
        .lte("day", stripSpan.to)
        .is("deleted_at", null)
        .abortSignal(queryDeadline(started)),
      // Is this day's month closed (ADR 0066)? In the same batch rather
      // than after it, because it depends on nothing: the month comes
      // from the address like everything else here, and a read of its own
      // would rebuild the waterfall ADR 0064 took apart.
      supabase
        .from("ministry_month_closures")
        .select("month")
        .eq("month", month)
        // The same repeat of the policy the strip's read above makes,
        // and /month makes on this very table: it costs nothing and
        // keeps the query right on its own terms rather than on the
        // policy's.
        .is("deleted_at", null)
        .abortSignal(queryDeadline(started))
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

  // Reported like every other read here, and unlike most of them it
  // stops nothing: the answer below still falls back to "open". Falling
  // back is deliberate, saying nothing was not — a closure read that
  // breaks leaves the card offering what the database then refuses with
  // sqlstate 55000, and "that month is closed" on a month the person
  // believes is open is unexplainable from the outside without this.
  if (closure.error) reportReadFailure({ scope: SCOPE, step: "closure", error: closure.error });

  return {
    status: "ready",
    timeZone: zone.timeZone,
    // No row is zero: nothing has been recorded for that day yet, and
    // the card opens where the day starts.
    savedMinutes: recorded.data?.minutes ?? 0,
    progress: readProgress({ month, monthTotal, yearTotal, status, yearGoal }),
    lastDays: readStrip(stripSpan, strip),
    // A read we could not make answers "open", and that is deliberate:
    // the lock lives in the database, which refuses the write whatever
    // this says, while a lock drawn on a guess would take the card away
    // from somebody entitled to it. The worst case is a tap that comes
    // back with a sentence instead of a saved number.
    isMonthClosed: !closure.error && closure.data !== null,
  };
};

// Four reads, and the block stands or falls on all four. None of them is
// fatal to the SCREEN — the day's hours are what people come here to
// change, and they are already in hand — but a half-drawn progress block
// states a fraction, and a fraction with a number missing from it is
// wrong rather than incomplete. So: report each failure, draw nothing.
type ProgressAnswers = {
  month: MonthKey;
  monthTotal: { data: number | null; error: unknown };
  yearTotal: { data: number | null; error: unknown };
  status: Parameters<typeof toEffectiveMinistryStatus>[0];
  yearGoal: { data: number | null; error: unknown };
};

// Zero hours is "no goal", not a goal of nothing: see the note on
// DayProgress.monthGoalHours above.
const noGoal = (hours: number | null): number | null => (hours === 0 ? null : hours);

const readProgress = (
  { month, monthTotal, yearTotal, status, yearGoal }: ProgressAnswers,
): DayProgress | null => {
  if (monthTotal.error) {
    reportReadFailure({ scope: SCOPE, step: "month-total", error: monthTotal.error });
  }

  if (yearTotal.error) {
    reportReadFailure({ scope: SCOPE, step: "year-total", error: yearTotal.error });
  }

  if (status.error) {
    reportReadFailure({ scope: SCOPE, step: "status", error: status.error });
  }

  if (yearGoal.error) {
    reportReadFailure({ scope: SCOPE, step: "year-goal", error: yearGoal.error });
  }

  // The status is turned into an answer by the entity, which also covers
  // the case of a status this build does not know: it answers null, and
  // a goal guessed from an unknown status would be worse than no block.
  const effective = toEffectiveMinistryStatus(status);

  // That second case is reported, and this line exists because it was
  // missing: the database holding a status newer than this build is not
  // an error anybody raised — PostgREST answers 200 — so without it the
  // whole block would vanish from somebody's screen leaving nothing
  // anywhere to say why. The one way it happens is a deploy that went
  // out in the wrong order, which is exactly the thing worth seeing in
  // Sentry the same day.
  if (!status.error && !effective) {
    reportReadFailure({
      scope: SCOPE,
      step: "status",
      error: new Error("ministry status outside this build's catalogue"),
    });
  }

  if (monthTotal.error || yearTotal.error || yearGoal.error || !effective) return null;

  return {
    month,
    monthMinutes: monthTotal.data ?? 0,
    monthGoalHours: noGoal(effective.monthlyGoalHours),
    yearMinutes: yearTotal.data ?? 0,
    // Not noGoal: the year's figure belongs to a regular pioneer and to
    // nobody else, however many pioneered months the sum found behind
    // them (the owner, 2026-10-29).
    yearGoalHours: visibleYearGoalHours(effective.status, yearGoal.data),
  };
};

// The strip stands or falls on its one read, for the reason the progress
// block does: what it draws is a claim about which days are empty.
const readStrip = (
  span: DaySpan,
  strip: { data: { day: string; minutes: number }[] | null; error: unknown },
): StripDay[] | null => {
  if (strip.error) {
    reportReadFailure({ scope: SCOPE, step: "last-days", error: strip.error });

    return null;
  }

  return stripDays(span, strip.data ?? []);
};
