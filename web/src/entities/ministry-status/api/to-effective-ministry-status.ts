import { isMinistryStatus } from "../model/catalogue";
import { parseMonthKey } from "../model/month-key";
import { DEFAULT_MINISTRY_STATUS, type EffectiveMinistryStatus } from "../model/resolve-status";

// Only the three columns this answer is read for; the function takes the
// shape rather than the generated Row type so it can be tested with a
// plain object.
type MinistryStatusRowFromDatabase = {
  status: string;
  monthly_goal_hours: number | null;
  month: string;
};

type MinistryStatusAnswer = {
  data: MinistryStatusRowFromDatabase | null;
  error: unknown;
};

// What `ministry_status_for_month` answered, turned into something a
// screen can render. The call itself stays at the call site — the screen
// already holds a Supabase client and reads its own profile row with it,
// and this slice's barrel is imported by the client components of the
// sheet, so a module here that built a server client would drag
// `server-only` into the browser bundle (ADR 0034's trap, met from the
// other side).
//
// Three outcomes, deliberately not collapsed into two:
//
//   * a row — that month's own, or an earlier one still running;
//   * DEFAULT_MINISTRY_STATUS — no row anywhere, which IS the answer
//     "publisher, no goal" rather than an absence of one;
//   * null — the read failed, or the database holds a status this build
//     does not know. The caller shows nothing at all, because a database
//     problem must not reach a screen as a claim about how this person
//     serves.
export const toEffectiveMinistryStatus = (
  { data, error }: MinistryStatusAnswer,
): EffectiveMinistryStatus | null => {
  if (error) return null;
  if (!data) return DEFAULT_MINISTRY_STATUS;

  // `status` is a text column, so it arrives as a string however narrow
  // the check constraint is. A value outside the catalogue means this
  // build is older than the database, and guessing would be worse than
  // saying nothing.
  if (!isMinistryStatus(data.status)) return null;

  return {
    status: data.status,
    monthlyGoalHours: data.monthly_goal_hours,
    source: parseMonthKey(data.month),
  };
};
