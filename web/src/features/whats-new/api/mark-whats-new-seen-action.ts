"use server";

import { revalidatePath } from "next/cache";

import { getSessionClaims } from "@/entities/session";
import { createServerSupabaseClient } from "@/shared/api";
import { APP_VERSION, routes } from "@/shared/config";
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
      return;
    }

    // Why the write alone is not enough, and why this is not an
    // optimisation: Next keeps a client-side BFCache of routes already
    // rendered, and a back navigation reads it with the staleness check
    // deliberately bypassed (`readFromBFCache` passes -1 instead of the
    // current time — see node_modules/next/dist/client/components/
    // segment-cache/bfcache.js). So /profile comes back drawn exactly as
    // it was left, dot and all, no matter what the database now says.
    // The one thing that evicts that cache is a revalidation: the action's
    // response carries `x-action-revalidated`, and the client calls
    // `invalidateBfCache()` when it does (server-action-reducer.js).
    //
    // /profile is dynamic (it reads session cookies), so there is no
    // cached payload on the server to purge. This call is here for the
    // signal it sends the client, which is the whole bug.
    revalidatePath(routes.profile);
  } catch (error) {
    reportActionFailure({ scope: "whats-new", error });
  }
};
