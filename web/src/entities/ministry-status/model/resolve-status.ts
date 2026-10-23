import type { MinistryStatus } from "./catalogue";
import type { MonthKey } from "./month-key";

// What a month's status comes to, as a screen renders it.
//
// There is no TypeScript copy of the carry-forward rule any more. It had
// one — a screen showing a whole service year would have resolved twelve
// months from rows it already held — and the owner removed it
// (2026-10-23): the year's goal is answered by
// public.ministry_status_year_goal, so the rule now exists once, in SQL,
// where a write can also be refused by it. An extra round trip is
// cheaper than a second implementation that can drift.
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
