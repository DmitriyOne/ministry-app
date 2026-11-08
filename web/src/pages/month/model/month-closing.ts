import { type MonthKey, monthsBetween } from "@/entities/ministry-status";

// What the bottom of the screen offers: nothing, closing, or the way
// back out.
//
// "hidden" rather than a disabled button while the month is being lived
// — the owner's rule (2026-10-29): the button appears after midnight of
// the following month. A disabled button would raise the question of
// what it takes to enable it; no button raises none.
//
// The database repeats this check with a day of slack from UTC, because
// a Server Action is a public endpoint. This is the interface half, and
// it counts exactly, in the person's own calendar.
export type MonthClosingState = "hidden" | "closable" | "closed";

export const monthClosingState = ({
  month,
  currentMonth,
  isClosed,
}: {
  month: MonthKey;
  // Null when the time zone did not read, so we cannot say which month
  // the person is in.
  currentMonth: MonthKey | null;
  isClosed: boolean;
}): MonthClosingState => {
  // A fact about a row, not a judgement about time: the way out stays
  // visible even when we cannot place the month in the calendar.
  if (isClosed) return "closed";

  if (currentMonth === null) return "hidden";

  return monthsBetween(month, currentMonth) > 0 ? "closable" : "hidden";
};
