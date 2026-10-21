import type { MinistryStatus, MinistryStatusDuration } from "./catalogue";
import type { MonthKey } from "./month-key";

// One stored row: a month in which something changed. Shaped to what the
// table returns, except that `month` is a parsed MonthKey — rows marked
// deleted and unparseable months are both dropped where the rows are
// read, so nothing downstream has to ask again.
export type MinistryStatusRow = {
  month: MonthKey;
  status: MinistryStatus;
  duration: MinistryStatusDuration;
  monthlyGoalHours: number | null;
};

export type EffectiveMinistryStatus = {
  status: MinistryStatus;
  monthlyGoalHours: number | null;
  // Which row answered. Null means no row did and the default below
  // applies; a month that is not the one asked about means the status
  // was carried forward from there.
  source: MonthKey | null;
};

// A person who has never chosen anything is a publisher with no goal,
// and that lives in the RULE rather than in the data: no backfill for
// accounts that already exist, no row written at sign-up, and nothing to
// keep in step when the catalogue changes.
export const DEFAULT_MINISTRY_STATUS: EffectiveMinistryStatus = {
  status: "publisher",
  monthlyGoalHours: null,
  source: null,
};

// The same rule as public.ministry_status_for_month, and the reason it
// exists twice: a screen showing a service year needs twelve answers,
// and twelve round trips for what twelve already-fetched rows can
// answer would be the n+1 this project avoids everywhere else. The
// database keeps its copy because it is the one place a write can be
// refused; this copy only ever reads rows the database already handed
// over.
//
// Rows may arrive in any order and may include months after the one
// asked about — a screen fetches a whole year at once and then asks
// about each month in turn.
export const resolveStatusForMonth = (
  rows: readonly MinistryStatusRow[],
  month: MonthKey,
): EffectiveMinistryStatus => {
  const latest = rows.reduce<MinistryStatusRow | null>((best, row) => {
    if (row.month > month) return best;

    // The month's own row always wins; an earlier row only counts while
    // it is still running. This single condition is what makes a
    // one-month auxiliary pioneer end itself instead of needing a second
    // row to close it.
    if (row.month !== month && row.duration !== "until_changed") return best;

    return best === null || row.month > best.month ? row : best;
  }, null);

  if (latest === null) return DEFAULT_MINISTRY_STATUS;

  return {
    status: latest.status,
    monthlyGoalHours: latest.monthlyGoalHours,
    source: latest.month,
  };
};
