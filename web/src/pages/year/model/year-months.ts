import { MINUTES_IN_HOUR } from "@/entities/ministry-day";
import { type MonthKey, parseMonthKey } from "@/entities/ministry-status";

// One line of the table: the month, what it holds, the goal it was held
// to, whether it is closed, and what the year came to by the end of it.
export type YearMonthRow = {
  month: MonthKey;
  // Null is "nothing recorded in this month" and the screen draws a dash
  // for it. Zero is a different fact — somebody opened the month and
  // recorded nothing — and prints as 0:00. The database keeps the two
  // apart by leaving an empty month out of its answer altogether, and
  // this is the one place that must not flatten them (ADR 0067,
  // decision 8).
  minutes: number | null;
  // What this month was held to, by the carry-forward rule that lives in
  // SQL. Null for a month with no status, and for a publisher, who sets
  // no goal.
  goalHours: number | null;
  isClosed: boolean;
  // Everything recorded in the service year up to and including this
  // month. Always a number: a year with nothing in it has run to zero,
  // which is not the same claim as "this month is empty".
  runningMinutes: number;
};

type MonthlyMinutes = { month: string; minutes: number };
type MonthlyStatus = { month: string; monthly_goal_hours: number | null };

// Zero hours is "no goal", not a goal of nothing — the same
// normalisation the month screen's summary makes, so the table draws one
// case rather than two.
const noGoal = (hours: number | null | undefined): number | null => (
  hours === 0 || hours === undefined ? null : hours
);

// Turns three sparse answers into the twelve dense lines the table
// draws.
//
// The months are the caller's (serviceYearMonths), not the readings':
// the table has twelve lines whether or not a query came back, so its
// shape does not depend on the network. Each reading is looked up by
// month, and a month missing from one of them is an absence with a
// meaning — spelled out on `minutes` above.
//
// A row whose month the database hands back in a shape parseMonthKey
// refuses is dropped rather than trusted, the way buildMonthDays drops
// an unparseable day: every line is a link, and a link to /month/garbage
// is a 404 at the other end.
export const buildYearMonths = ({
  months,
  minutes,
  statuses,
  closedMonths,
}: {
  months: MonthKey[];
  minutes: MonthlyMinutes[];
  statuses: MonthlyStatus[];
  closedMonths: string[];
}): YearMonthRow[] => {
  const byMonth = new Map<MonthKey, number>();

  for (const row of minutes) {
    const key = parseMonthKey(row.month);

    if (key !== null) byMonth.set(key, row.minutes);
  }

  const goals = new Map<MonthKey, number | null>();

  for (const row of statuses) {
    const key = parseMonthKey(row.month);

    if (key !== null) goals.set(key, noGoal(row.monthly_goal_hours));
  }

  const closed = new Set<MonthKey>();

  for (const month of closedMonths) {
    const key = parseMonthKey(month);

    if (key !== null) closed.add(key);
  }

  let running = 0;

  return months.map((month) => {
    const recorded = byMonth.get(month) ?? null;

    // A month nobody recorded in adds nothing, which is also what a
    // recorded zero adds: the running total stands still across both,
    // and only the figure beside it tells them apart.
    running += recorded ?? 0;

    return {
      month,
      minutes: recorded,
      goalHours: goals.get(month) ?? null,
      isClosed: closed.has(month),
      runningMinutes: running,
    };
  });
};

// Whether the table has anything to show at all. A year in which nothing
// was recorded says so in a sentence rather than drawing twelve dashes
// (ADR 0067, decision 8).
export const hasAnyHours = (rows: YearMonthRow[]): boolean =>
  rows.some((row) => row.minutes !== null);

// Whether this month came up short of its own goal — the question the
// colour on the figure answers.
//
// A month that has not FINISHED is never short, and that is the whole
// reason this is a function rather than a comparison in the markup. On
// the 5th of November, 7:25 of 50 h is of course below the goal, and
// painting it like a miss tells somebody they failed a month they are
// standing in with twenty-five days to go. Found on the real screen,
// where November came up terracotta.
//
// The same reading the rest of the app already makes: the month screen's
// pace block measures against TODAY rather than the whole month, the
// closing button stays hidden until the month is over (ADR 0066), and a
// past month's difference against its goal IS its result.
//
// A month with no goal is never short either: there is nothing it fell
// short of. Nor is a month with nothing recorded — that is an absence,
// and the dash says so.
export const isMonthShort = (
  row: YearMonthRow,
  currentMonth: MonthKey | null,
): boolean => {
  if (row.goalHours === null || row.minutes === null) return false;

  // The month being lived, and anything after it, has not finished. An
  // unknown current month — the zone did not read — means no month is
  // called a miss: a guess here would be wrong by a month for anybody
  // near a boundary, and silence costs only a colour.
  if (currentMonth === null || row.month >= currentMonth) return false;

  return row.minutes < row.goalHours * MINUTES_IN_HOUR;
};
