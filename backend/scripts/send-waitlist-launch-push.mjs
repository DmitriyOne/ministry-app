import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

const required = [
  "SUPABASE_URL",
  "SUPABASE_SECRET_KEY",
  "WEB_PUSH_VAPID_PUBLIC_KEY",
  "WEB_PUSH_VAPID_PRIVATE_KEY",
  "WEB_PUSH_VAPID_SUBJECT",
];

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`Missing environment variable: ${name}`);
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  },
);

const { data: subscriptions, error } = await supabase
  .from("push_subscriptions")
  .select("id, endpoint, p256dh, auth")
  // Soft-deleted subscriptions must not be messaged (ADR 0047).
  .is("deleted_at", null)
  // Waitlist devices only. Since migration 20261013094149 the same table
  // also holds subscriptions made from the profile screen by people who
  // already have an account — the launch announcement is not for them,
  // and without this filter they would be told about a launch they are
  // already past.
  .not("waitlist_signup_id", "is", null);

if (error) {
  throw error;
}

let sent = 0;
let removed = 0;
let failed = 0;

for (const subscription of subscriptions ?? []) {
  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth,
        },
      },
      JSON.stringify({
        // Deliberately not the app's own name: iOS prints that above every
        // notification already, so "MinistryApp" as a title reads as
        // "MinistryApp from MinistryApp" on the lock screen.
        title: "The wait is over",
        body: "MinistryApp has launched. Open it and start tracking your hours.",
        url: "/",
      }),
      {
        TTL: 60 * 60 * 24,
        vapidDetails: {
          subject: process.env.WEB_PUSH_VAPID_SUBJECT,
          publicKey: process.env.WEB_PUSH_VAPID_PUBLIC_KEY,
          privateKey: process.env.WEB_PUSH_VAPID_PRIVATE_KEY,
        },
      },
    );

    sent += 1;
  } catch (sendError) {
    const statusCode =
      typeof sendError === "object" &&
      sendError !== null &&
      "statusCode" in sendError
        ? sendError.statusCode
        : undefined;

    // 404/410 means the browser/push service says this subscription is
    // gone. Mark it deleted so later campaigns do not retry a permanently
    // dead endpoint — a soft delete, not a real one (ADR 0047): no row in
    // this project is ever removed, and the freed endpoint stays reusable
    // because its unique index only covers live rows.
    if (statusCode === 404 || statusCode === 410) {
      const { error: deleteError } = await supabase
        .from("push_subscriptions")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", subscription.id);

      if (deleteError) {
        failed += 1;
        console.error("[push] could not remove expired subscription", {
          subscriptionId: subscription.id,
          code: deleteError.code,
        });
      } else {
        removed += 1;
      }

      continue;
    }

    failed += 1;
    console.error("[push] launch delivery failed", {
      subscriptionId: subscription.id,
      statusCode,
    });
  }
}

console.info("[push] launch delivery complete", {
  sent,
  removed,
  failed,
});
