import { addDays, type DayKey, parseDayKey, toDayKey } from "@/entities/ministry-day";
import { addMonths, type MonthKey } from "@/entities/ministry-status";

// One square of the grid. A day of the month, what it holds and what the
// month came to by the end of it.
export type CalendarDay = {
  day: DayKey;
  // The number printed in the square: 1…31, without the month around it.
  dayOfMonth: number;
  // Null is "nothing recorded in this day" and the square carries no
  // dot. Zero is a different fact — somebody opened the day and recorded
  // nothing — and gets a dot like any other record (ADR 0069, decision
  // 3). The database keeps the two apart by leaving an empty day out of
  // its answer altogether.
  minutes: number | null;
  // Everything recorded in this month up to and including this day, the
  // figure the day card calls "month by then". Always a number: a month
  // with nothing in it has run to zero.
  runningMinutes: number;
};

// A week of the grid: seven slots, left to right, Monday first. A slot
// is null where the month has not started yet or has already ended —
// those squares are blank, carry no number and cannot be pressed (ADR
// 0069, decision 7).
export type CalendarWeek = (CalendarDay | null)[];

export const DAYS_IN_WEEK = 7;

const yearOf = (month: MonthKey): number => Number(month.slice(0, 4));
const monthOf = (month: MonthKey): number => Number(month.slice(5, 7));

const firstDayOf = (month: MonthKey): DayKey => toDayKey(yearOf(month), monthOf(month), 1);

const daysInMonth = (month: MonthKey): number =>
  Number(addDays(firstDayOf(addMonths(month, 1)), -1).slice(8, 10));

// How many blank squares come before the 1st. Monday is 0 and Sunday is
// 6, which is `getUTCDay()` rotated by one — JavaScript counts weeks
// from Sunday, this calendar from Monday.
//
// UTC, like every other date calculation on a DayKey: a key carries no
// zone, and reading it in the server's would move the month by a day for
// anybody west of it.
const leadingBlanks = (month: MonthKey): number => {
  const firstWeekday = new Date(`${firstDayOf(month)}T00:00:00Z`).getUTCDay();

  return (firstWeekday + 6) % DAYS_IN_WEEK;
};

// The grid, built from the month in the address and the rows the
// database answered with.
//
// The month decides the shape — the squares exist whether or not a query
// came back — and the rows only fill it in. A day missing from them is
// an absence with a meaning, spelled out on `minutes` above.
//
// A row whose day comes back in a shape parseDayKey refuses is dropped
// rather than trusted, the way buildMonthDays drops one: every square is
// a link to its day, and a link to /day/2026-06-31 is a 404 at the other
// end.
export const buildCalendarWeeks = (
  month: MonthKey,
  rows: { day: string; minutes: number }[],
): CalendarWeek[] => {
  const recorded = new Map<DayKey, number>();

  for (const row of rows) {
    const key = parseDayKey(row.day);

    if (key !== null) recorded.set(key, row.minutes);
  }

  const length = daysInMonth(month);
  const squares: (CalendarDay | null)[] = Array.from(
    { length: leadingBlanks(month) },
    () => null,
  );

  let running = 0;

  for (let dayOfMonth = 1; dayOfMonth <= length; dayOfMonth += 1) {
    const day = toDayKey(yearOf(month), monthOf(month), dayOfMonth);
    const minutes = recorded.get(day) ?? null;

    // A day nobody recorded adds nothing, which is also what a recorded
    // zero adds: the running total stands still across both, and only
    // the dot tells them apart.
    running += minutes ?? 0;

    squares.push({ day, dayOfMonth, minutes, runningMinutes: running });
  }

  // The last week is padded too, so every row has seven cells and the
  // grid does not go ragged on the final line.
  while (squares.length % DAYS_IN_WEEK !== 0) squares.push(null);

  const weeks: CalendarWeek[] = [];

  for (let start = 0; start < squares.length; start += DAYS_IN_WEEK) {
    weeks.push(squares.slice(start, start + DAYS_IN_WEEK));
  }

  return weeks;
};

// The squares alone, in order, for the parts that do not care about rows
// — the day card looking up what was selected, and the test that counts
// them.
export const calendarDays = (weeks: CalendarWeek[]): CalendarDay[] =>
  weeks.flat().filter((square): square is CalendarDay => square !== null);

// Which day the screen opens on. Today, but only in the month being
// lived: in any other month there is no today, and choosing the 1st for
// somebody would answer a question they did not ask (ADR 0069, decision
// 6). Null then, and the card says so instead of standing empty.
export const initialSelectedDay = (
  month: MonthKey,
  today: DayKey | null,
): DayKey | null => (
  today !== null && today.slice(0, 7) === month.slice(0, 7) ? today : null
);
