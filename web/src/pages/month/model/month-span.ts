import { addDays, type DayKey, toDayKey } from "@/entities/ministry-day";
import { addMonths, type MonthKey, monthsBetween, toMonthKey } from "@/entities/ministry-status";

// Which days this screen is about, worked out from the month in the
// address and nothing else — the same rule the day screen follows (ADR
// 0064, decision 2): open June and the screen answers for June, not for
// the month the phone is in.
//
// Here, in the screen's own model, because it composes two entities: the
// days come from ministry-day, the months from ministry-status, and
// entities may not import each other. pages/day works out its own month
// span the same way, from the same two entities, and the duplication is
// what the layer rules buy — a shared helper would have to live in one
// page and be imported by the other, which is the cross-import FSD
// forbids.
//
// Nothing here can fail: both keys are branded, so they can only have
// been made by their own constructors.
export type MonthSpan = {
  // Both ends included, which is what ministry_days_total_minutes takes.
  from: DayKey;
  to: DayKey;
};

const yearOf = (key: MonthKey): number => Number(key.slice(0, 4));
const monthOf = (key: MonthKey): number => Number(key.slice(5, 7));

const firstDayOf = (month: MonthKey): DayKey => toDayKey(yearOf(month), monthOf(month), 1);

// The last day is the day before the first of the month after, so there
// is no table of month lengths here and no leap-year rule: addMonths
// rolls the year over, addDays counts in UTC, and February 2028 ends on
// the 29th without this file knowing that.
export const monthSpan = (month: MonthKey): MonthSpan => ({
  from: firstDayOf(month),
  to: addDays(firstDayOf(addMonths(month, 1)), -1),
});

// The service year this month belongs to starts in September; the start
// itself is worked out by the entity (serviceYearStartMonth) and the
// span of twelve months from it is this.
export const twelveMonthSpan = (yearStart: MonthKey): MonthSpan => ({
  from: firstDayOf(yearStart),
  to: addDays(firstDayOf(addMonths(yearStart, 12)), -1),
});

// Whether the arrow forward is live. False on the month the person is
// in, and false when we do not know which month that is: the zone did
// not read, and stepping forward on a guess would hand somebody a 404
// exactly at the moment the database answered again (the same reasoning
// as the day screen's arrow, ADR 0063, update 2026-10-29).
export const canStepForward = (
  month: MonthKey,
  currentMonth: MonthKey | null,
): boolean => currentMonth !== null && monthsBetween(month, currentMonth) > 0;
