// Announces a new version to the people who use the app.
//
// Run from the repository root: `pnpm push:version` prints what it would
// do and sends nothing; `pnpm push:version --send` actually sends. The
// dry run is the default on purpose — see ADR 0058. The version comes
// from the root package.json, the single place it lives (ADR 0057).
//
// Deliberately NOT a copy of send-waitlist-launch-push.mjs: that script
// was written for one day and carries three recorded defects (ADR 0038).
// This one runs at every release, so repeating them would mean repeating
// them for ever. Two of the three are fixed here — the thousand-row cap
// and the undefined ordering. The third, idempotency, is named in ADR
// 0058 as accepted debt.
import { readFileSync } from "node:fs";

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

const shouldSend = process.argv.includes("--send");

const { version } = JSON.parse(
  readFileSync(new URL("../../package.json", import.meta.url), "utf8"),
);

// A version that is not plain x.y.z means the root package.json is mid-
// edit or carries a pre-release tag. Neither is something to announce to
// people, and the same shape is enforced by the version-bump job in CI
// and by the unread marker (ADR 0057).
if (!/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(
    `Refusing to announce version "${version}": expected plain x.y.z`,
  );
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

// Paged by key, not by offset, and ordered explicitly. Both matter and
// both were missing from the launch script: PostgREST silently truncates
// at `max_rows` (1000 by default, locally and in the cloud), so a plain
// select would announce the release to the first thousand devices and
// print success; and dead subscriptions are soft-deleted inside the loop
// below, which shifts every offset-based page under our own feet.
const PAGE_SIZE = 500;

const readPage = async (afterId) => {
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    // Soft-deleted subscriptions must not be messaged (ADR 0047).
    .is("deleted_at", null)
    // People with an account, which is the mirror image of the launch
    // script's filter. A waitlist device belongs to somebody who has not
    // got in yet; "version 2.1 is out" means nothing to them.
    .not("user_id", "is", null)
    .gt("id", afterId)
    .order("id", { ascending: true })
    .limit(PAGE_SIZE);

  if (error) {
    throw error;
  }

  return data ?? [];
};

const notification = JSON.stringify({
  // Not the app's own name: iOS already prints that above every
  // notification, so "MinistryApp" as a title reads as "MinistryApp from
  // MinistryApp" on the lock screen.
  title: `Version ${version} is here`,
  body: "Open What's New to see what the app has gained.",
  url: "/whats-new",
});

let seen = 0;
let sent = 0;
let removed = 0;
let failed = 0;
let afterId = 0;

for (;;) {
  const page = await readPage(afterId);

  if (page.length === 0) {
    break;
  }

  for (const subscription of page) {
    seen += 1;
    afterId = subscription.id;

    if (!shouldSend) {
      continue;
    }

    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        notification,
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
        typeof sendError === "object"
        && sendError !== null
        && "statusCode" in sendError
          ? sendError.statusCode
          : undefined;

      // 404/410 is the push service saying this subscription is gone for
      // good. Mark it deleted so the next release does not retry a dead
      // endpoint — soft, never a real delete (ADR 0047), and the endpoint
      // stays reusable because its unique index covers live rows only.
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
      console.error("[push] version delivery failed", {
        subscriptionId: subscription.id,
        statusCode,
      });
    }
  }

  if (page.length < PAGE_SIZE) {
    break;
  }
}

if (!shouldSend) {
  console.info("[push] dry run — nothing was sent", {
    version,
    devices: seen,
    title: `Version ${version} is here`,
    url: "/whats-new",
    hint: "add --send to deliver",
  });

  process.exit(0);
}

console.info("[push] version delivery complete", {
  version,
  devices: seen,
  sent,
  removed,
  failed,
});

// A non-zero exit for real failures: this is run by hand, and a line in
// the middle of the output is easy to miss. Expired subscriptions are not
// failures — removing them is the script working as intended.
if (failed > 0) {
  process.exit(1);
}
