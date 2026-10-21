import "server-only";

import { createServerSupabaseClient } from "@/shared/api";

import { isMinistryStatus } from "../model/catalogue";
import { type MonthKey, parseMonthKey } from "../model/month-key";
import { DEFAULT_MINISTRY_STATUS, type EffectiveMinistryStatus } from "../model/resolve-status";

// The status in force for one month, read under the person's own
// session: the select policy limits it to their rows, and the function
// applies the carry-forward rule in the database so a screen asking
// about a single month does it in a single round trip (ADR 0061).
//
// Three outcomes, and they are deliberately not collapsed into two:
//
//   * a row — that month's own, or an earlier one still running;
//   * DEFAULT_MINISTRY_STATUS — no row anywhere, which IS the answer
//     "publisher, no goal" rather than an absence of one;
//   * null — the read failed, or the database holds a status this build
//     does not know. The caller shows nothing at all, because a database
//     problem must not reach a screen as a claim about how this person
//     serves.
export const getMinistryStatusForMonth = async (
  month: MonthKey,
): Promise<EffectiveMinistryStatus | null> => {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .rpc("ministry_status_for_month", { p_month: month })
    .maybeSingle();

  if (error) return null;
  if (!data) return DEFAULT_MINISTRY_STATUS;

  // `status` and `duration` are text columns, so they arrive as strings
  // however narrow the check constraint is. A value outside the
  // catalogue means this build is older than the database, and guessing
  // would be worse than saying nothing.
  if (!isMinistryStatus(data.status)) return null;

  return {
    status: data.status,
    monthlyGoalHours: data.monthly_goal_hours,
    source: parseMonthKey(data.month),
  };
};
