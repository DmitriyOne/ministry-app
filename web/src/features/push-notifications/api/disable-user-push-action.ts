"use server";

import { getSessionClaims } from "@/entities/session";
import { createAdminSupabaseClient } from "@/shared/api";
import { reportActionFailure } from "@/shared/lib/action-failure";

import { disableUserPushSchema, type UserPushResult } from "../model/user-push-schema";

// Marks the subscription deleted after the browser has already
// unsubscribed. No rate limiter: this only ever removes, and the RPC is
// scoped to the caller's own row, so the worst a flood achieves is
// marking a row deleted that is deleted already.
export const disableUserPush = async (input: unknown): Promise<UserPushResult> => {
  const claims = await getSessionClaims();

  if (!claims) {
    console.warn("[push] rejected", { reason: "no-session" });

    return { status: "error" };
  }

  const parsed = disableUserPushSchema.safeParse(input);

  if (!parsed.success) return { status: "error" };

  try {
    const { error } = await createAdminSupabaseClient().rpc(
      "forget_user_push_subscription",
      { p_user_id: claims.userId, p_endpoint: parsed.data.endpoint },
    );

    if (error) {
      // The browser's subscription is already gone; leaving the row
      // behind means pushes keep being sent to an endpoint nobody reads.
      reportActionFailure({
        scope: "push",
        error,
        outcome: "failed",
        context: { reason: "supabase-error", code: error.code },
      });
      console.warn("[push] could not forget subscription", { code: error.code });

      return { status: "error" };
    }

    // `false` from the function means there was no live row for this
    // person and endpoint — which is the state the caller wanted. The
    // browser has already unsubscribed either way.
    return { status: "success" };
  } catch (error) {
    reportActionFailure({ scope: "push", error });

    return { status: "error" };
  }
};
