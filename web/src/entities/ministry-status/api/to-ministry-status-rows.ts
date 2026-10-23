import { isMinistryStatus, isMinistryStatusDuration } from "../model/catalogue";
import { parseMonthKey } from "../model/month-key";
import type { MinistryStatusRow } from "../model/resolve-status";

type MinistryStatusRowFromDatabase = {
  month: string;
  status: string;
  duration: string;
  monthly_goal_hours: number | null;
};

type MinistryStatusRowsAnswer = {
  data: MinistryStatusRowFromDatabase[] | null;
  error: unknown;
};

// The rows a screen reads for a whole service year, turned into the
// shape the rules work on. The call itself stays at the call site: this
// barrel is imported by the client components of the sheet, so nothing
// in it may build a server client (ADR 0034's trap, met from the other
// side).
//
// Null is "say nothing": the read failed, or a row carries a status or a
// month this build cannot read, which means the database is ahead of it.
// An empty array is a different answer — a person who has never chosen
// anything — and the rules turn that into "publisher, no goal".
//
// One bad row spoils the whole answer rather than being skipped. A
// skipped row is a month quietly missing from the year's total, which
// would show as a goal that is simply wrong; refusing to answer at all
// is the only honest option when part of the history cannot be read.
export const toMinistryStatusRows = (
  { data, error }: MinistryStatusRowsAnswer,
): MinistryStatusRow[] | null => {
  if (error || !data) return null;

  const rows: MinistryStatusRow[] = [];

  for (const row of data) {
    const month = parseMonthKey(row.month);

    if (!month || !isMinistryStatus(row.status) || !isMinistryStatusDuration(row.duration)) {
      return null;
    }

    rows.push({
      month,
      status: row.status,
      duration: row.duration,
      monthlyGoalHours: row.monthly_goal_hours,
    });
  }

  return rows;
};
