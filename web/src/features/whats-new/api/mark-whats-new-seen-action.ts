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
      return;
    }

    // No revalidation here, deliberately, and this absence is the fix
    // for a second bug rather than a reversion of the first.
    //
    // The first bug: a back navigation to /profile replays the payload
    // the router already holds, with the staleness check bypassed
    // (`readFromBFCache` passes -1 instead of the current time), so the
    // dot came back lit over a database that said otherwise.
    // `revalidatePath` fixed it, because the action's response then
    // carries `x-action-revalidated` and the client answers it with
    // `invalidateBfCache()`.
    //
    // The second bug, which that fix caused: evicting the entry turns
    // every exit from this screen into a server round trip for /profile,
    // and /whats-new sits outside the (with-bottom-nav) group, so the
    // group's layout is rebuilt in the same navigation. The screen
    // visibly flickers on the way out — every time, for everyone,
    // whereas the stale dot was once per release.
    //
    // The dot is now corrected on the client from a local record
    // (features/whats-new/lib/seen-version-store.ts), so nothing here
    // has to reach across to another screen. What stays is this write:
    // the record for every other device the person signs in on.
    //
    // The project rule that a Server Action changing ANOTHER screen must
    // revalidate it still holds (CLAUDE.md). This action no longer
    // changes another screen — it writes a row, and the screen that
    // reads that row is told separately.
  } catch (error) {
    reportActionFailure({ scope: "whats-new", error });
  }
};
