import type { JoinWaitlistActionState } from "./schema";

// The row public.join_waitlist returns, in the database's own snake_case.
// Kept as a small local transport type so this mapper stays a pure function
// that unit tests can exercise without creating a Supabase client.
export type JoinWaitlistRow = {
  already_joined: boolean;
  list_position: number;
  push_enrollment_token: string | null;
};

export const mapJoinWaitlistRow = (
  row: JoinWaitlistRow | null | undefined,
  submitErrorText: string,
): JoinWaitlistActionState => {
  if (!row || !Number.isInteger(row.list_position) || row.list_position < 1) {
    return { status: "error", formError: submitErrorText };
  }

  return {
    status: "success",
    position: row.list_position,
    alreadyJoined: row.already_joined,
    pushEnrollmentToken:
      !row.already_joined && row.push_enrollment_token
        ? row.push_enrollment_token
        : undefined,
  };
};
