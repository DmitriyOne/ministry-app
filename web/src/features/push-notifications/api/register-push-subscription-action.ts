"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import webpush from "web-push";

import { createAdminSupabaseClient } from "@/shared/api";
import { reportActionFailure } from "@/shared/lib/action-failure";
import { env, routes } from "@/shared/config";
import { getClientIp } from "@/shared/lib/rate-limit";

import { checkPushRegistrationRateLimit } from "./rate-limit";
import {
  registerPushSubscriptionSchema,
  type RegisterPushSubscriptionResult,
} from "../model/schema";

export const registerPushSubscription = async (
  input: unknown,
): Promise<RegisterPushSubscriptionResult> => {
  const t = await getTranslations("notifications.waitlist");

  // Checked before validation or any database work, same order as the
  // waitlist action. The IP is only an in-memory rate-limit key — never
  // logged, and the subscription token is never logged either.
  const ip = getClientIp(await headers());
  const rateLimit = checkPushRegistrationRateLimit(ip);

  if (!rateLimit.success) {
    console.warn("[push] rate limit exceeded", { scope: rateLimit.scope });
    return { status: "error" };
  }

  const parsed = registerPushSubscriptionSchema.safeParse(input);

  if (!parsed.success) {
    return { status: "error" };
  }

  const { enrollmentToken, subscription } = parsed.data;
  // Secret-key client (ADR 0037): anon can no longer execute this function.
  // The rate limiter above is now the only thing standing between the
  // public and this write; the database does not rate-limit anything itself.
  const supabase = createAdminSupabaseClient();

  const { data, error } = await supabase.rpc(
    "register_waitlist_push_subscription",
    {
      p_token: enrollmentToken,
      p_endpoint: subscription.endpoint,
      p_p256dh: subscription.keys.p256dh,
      p_auth: subscription.keys.auth,
    },
  );

  if (error || data !== true) {
    // The enrolment token is one-shot and has now been spent: the person
    // cannot retry from the success card, so a failure here costs them
    // notifications entirely. supabase-js returns `error` rather than
    // throwing, so no catch sees this.
    reportActionFailure({
      scope: "push",
      error: error ?? new Error("register_waitlist_push_subscription returned false"),
      outcome: "failed",
      context: { reason: "supabase-error", code: error?.code },
    });
    console.error("[push] could not register subscription", {
      code: error?.code,
      message: error?.message,
    });

    return { status: "error" };
  }

  // The subscription is already safely stored. The confirmation delivery is
  // best-effort: a transient push-service failure must not undo enrollment,
  // and a slow push service must never hold the response open.
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify({
        // Not the app's own name: iOS already prints it above every
        // notification, so a title of "MinistryApp" reads on the lock screen
        // as "MinistryApp from MinistryApp". The title has to say something
        // the header does not.
        title: t("confirmation.title"),
        body: t("confirmation.body"),
        url: routes.soon,
      }),
      {
        TTL: 60 * 60,
        timeout: 5000,
        vapidDetails: {
          subject: env.WEB_PUSH_VAPID_SUBJECT,
          publicKey: env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
          privateKey: env.WEB_PUSH_VAPID_PRIVATE_KEY,
        },
      },
    );
  } catch (sendError) {
    // Logged, not reported, unlike the failures above: a push service
    // refusing one message is ordinary (an expired endpoint, a rate
    // limit, a network blip), the subscription is already stored, and
    // Sentry would fill with events nobody acts on. The case this does
    // not catch is a systematic failure — wrong VAPID keys, say — which
    // would look identical one event at a time and has to be noticed by
    // nobody receiving anything.
    console.error("[push] confirmation delivery failed", {
      statusCode:
        typeof sendError === "object"
        && sendError !== null
        && "statusCode" in sendError
          ? sendError.statusCode
          : undefined,
    });
  }

  return { status: "success" };
};
