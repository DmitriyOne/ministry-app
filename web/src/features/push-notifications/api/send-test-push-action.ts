"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import webpush from "web-push";

import { getSessionClaims } from "@/entities/session";
import { createAdminSupabaseClient } from "@/shared/api";
import { env, routes } from "@/shared/config";
import { reportActionFailure } from "@/shared/lib/action-failure";
import { getClientIp } from "@/shared/lib/rate-limit";

import { checkUserPushRateLimit } from "./user-push-rate-limit";
import { disableUserPushSchema, type UserPushResult } from "../model/user-push-schema";

// The proof that turning the switch on did something. Without it the
// person has only our word that notifications now work, and the first
// real one may be days away — by which time a silent failure (a stale
// subscription, a VAPID key that does not match the one the subscription
// was made with) is no longer connected to the thing that caused it.
//
// The keys come from the stored row, not from the request: the row is
// looked up by this person's id AND the endpoint, so the worst a crafted
// request can do is send a test notification to a device that is already
// its own. Sending to keys supplied in the body would have made this a
// way to push to any subscription whose secrets leaked.
export const sendTestPush = async (input: unknown): Promise<UserPushResult> => {
  const claims = await getSessionClaims();

  if (!claims) {
    console.warn("[push] rejected", { reason: "no-session" });

    return { status: "error" };
  }

  const ip = getClientIp(await headers());

  // Counted against the same budget as registering: this one actually
  // sends a message, so it is the half that must not be free.
  if (!checkUserPushRateLimit(ip).success) {
    console.warn("[push] rate limit exceeded", { reason: "test-push" });

    return { status: "error" };
  }

  const parsed = disableUserPushSchema.safeParse(input);

  if (!parsed.success) return { status: "error" };

  const t = await getTranslations("notifications.push");

  try {
    const { data: row, error } = await createAdminSupabaseClient()
      .from("push_subscriptions")
      .select("endpoint, p256dh, auth")
      .eq("user_id", claims.userId)
      .eq("endpoint", parsed.data.endpoint)
      .is("deleted_at", null)
      .maybeSingle();

    if (error || !row) {
      console.warn("[push] no subscription to test", { code: error?.code });

      return { status: "error" };
    }

    await webpush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      JSON.stringify({
        // Not the app's name: iOS prints that above every notification
        // already, so a title of "MinistryApp" reads on the lock screen as
        // "MinistryApp from MinistryApp".
        title: t("testTitle"),
        body: t("testBody"),
        url: routes.profile,
      }),
      {
        // A test notification that arrives tomorrow is worse than none, so
        // it expires in five minutes rather than the hour the waitlist
        // confirmation allows itself.
        TTL: 5 * 60,
        timeout: 5000,
        vapidDetails: {
          subject: env.WEB_PUSH_VAPID_SUBJECT,
          publicKey: env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
          privateKey: env.WEB_PUSH_VAPID_PRIVATE_KEY,
        },
      },
    );

    return { status: "success" };
  } catch (error) {
    // The subscription is stored either way — this is the delivery
    // failing, not the switch. The caller says so rather than undoing
    // anything.
    reportActionFailure({ scope: "push", error, outcome: "failed" });

    return { status: "error" };
  }
};
