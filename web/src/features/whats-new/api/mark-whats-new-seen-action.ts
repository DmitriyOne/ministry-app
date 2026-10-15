"use server";

import { getSessionClaims } from "@/entities/session";
import { createServerSupabaseClient } from "@/shared/api";
import { APP_VERSION } from "@/shared/config";
import { reportActionFailure } from "@/shared/lib/action-failure";

// Records that this person has opened the What's New screen for the
// version now running, which is what clears the dot on the profile.
//
// Written under the person's OWN session, not the admin client: the
// "update own profile" policy picks the row and the column grant
// (`grant update (whats_new_seen)`, ADR 0043/0057) picks the field, so
// the database enforces both halves and this action cannot be talked
// into writing somebody else's row or somebody else's column.
//
// It returns nothing. A failure here costs a dot that stays lit until
// the next visit — not worth a toast, and certainly not worth blocking
// the screen the person came to read.
export const markWhatsNewSeen = async (): Promise<void> => {
  const claims = await getSessionClaims();

  if (!claims) return;

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from("profiles")
      .update({ whats_new_seen: APP_VERSION })
      .eq("id", claims.userId);

    // supabase-js does not throw on a failed query, it returns `error`,
    // so the catch below never sees this branch — and every plausible
    // cause here is a defect rather than something a person did: the
    // column missing, the grant missing, the policy refusing. Reported,
    // not just logged (ADR 0046).
    // `reason` overrides the helper's default "threw", which would be a
    // lie here: supabase-js does not throw on a failed query, it returns
    // `error`, so the catch below never sees this branch. Every plausible
    // cause is a defect rather than something a person did — the column
    // missing, the grant missing, the policy refusing — so it is reported,
    // not merely logged (ADR 0046).
    if (error) {
      reportActionFailure({
        scope: "whats-new",
        error,
        outcome: "failed",
        context: { reason: "supabase-error", code: error.code },
      });
    }
  } catch (error) {
    reportActionFailure({ scope: "whats-new", error });
  }
};
