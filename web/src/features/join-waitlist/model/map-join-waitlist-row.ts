import type { JoinWaitlistActionState } from "./schema";

// The row public.join_waitlist returns, in the database's own snake_case
// (see backend/supabase/migrations/20261001120000_waitlist_signups.sql).
// Declared here rather than taken from the generated Supabase types so
// the mapping below stays a pure function the tests can reach without a
// client, a key or a running database.
export type JoinWaitlistRow = {
  already_joined: boolean;
  list_position: number;
};

export const mapJoinWaitlistRow = (
  row: JoinWaitlistRow | null | undefined,
  submitErrorText: string,
): JoinWaitlistActionState => {
  // A counted position always includes the row the function just found or
  // inserted, so the smallest honest value is 1. Nothing came back, or a
  // value outside that — the contract broke, and asking the person to try
  // again beats showing them a place in the list that isn't theirs.
  if (!row || !Number.isInteger(row.list_position) || row.list_position < 1) {
    return { status: "error", formError: submitErrorText };
  }

  return {
    status: "success",
    position: row.list_position,
    alreadyJoined: row.already_joined,
  };
};
