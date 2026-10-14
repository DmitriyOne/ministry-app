import { isStandaloneDisplayMode } from "@/shared/lib/display-mode";

import type { SerializablePushSubscription } from "./subscribe-to-push";

// What the browser currently thinks, without asking the person anything.
//
// This is the question the profile screen opens with, and it is not the
// same question subscribeToPush answers: that one PROMPTS, and a prompt
// is one-shot on iOS — spending it to render a switch would be a bug with
// consequences. Here nothing is requested; Notification.permission and
// pushManager.getSubscription() both just report.
//
// It is also how "we may already have consent" is answered: someone who
// turned notifications on from the waitlist, in this same installed app,
// already has a subscription, and the switch must open showing that
// rather than offering to do it again.
const SERVICE_WORKER_TIMEOUT_MS = 3000;

export type PushPermission = "unsupported" | "default" | "granted" | "denied";

export type PushState = {
  permission: PushPermission;
  // The subscription this browser already holds, if any — whole, not just
  // its endpoint: claiming it for the signed-in account means writing the
  // keys too, and reading them here is free while fetching them later
  // would mean asking the push manager twice.
  subscription: SerializablePushSubscription | null;
};

export const readPushSubscription = async (): Promise<PushState> => {
  if (
    !("serviceWorker" in navigator)
    || !("PushManager" in window)
    || !("Notification" in window)
    // iOS delivers Web Push only to a Home Screen app. In a tab the APIs
    // exist and the subscription would fail later, so the honest answer
    // here is that this browser cannot do it at all.
    || !isStandaloneDisplayMode()
  ) {
    return { permission: "unsupported", subscription: null };
  }

  try {
    // navigator.serviceWorker.ready never rejects and never times out: with
    // no registration at all it simply waits for one, for ever. That is
    // the state in development, where SerwistProvider is disabled
    // (root-layout.tsx), and it is also what a worker that fails to
    // activate looks like in production. Without this race the row would
    // sit with a permanently disabled switch and no explanation. Three
    // seconds is far longer than an already-active worker needs.
    const registration = await Promise.race([
      navigator.serviceWorker.ready,
      new Promise<null>((resolve) => {
        globalThis.setTimeout(() => resolve(null), SERVICE_WORKER_TIMEOUT_MS);
      }),
    ]);

    if (!registration) return { permission: "unsupported", subscription: null };
    const subscription = await registration.pushManager.getSubscription();
    const json = subscription?.toJSON();

    return {
      permission: Notification.permission,
      // A subscription missing either key is unusable for sending, so it
      // counts as not having one — the same judgement subscribeToPush
      // makes about what it produces.
      subscription:
        json?.endpoint && json.keys?.p256dh && json.keys.auth
          ? { endpoint: json.endpoint, keys: { p256dh: json.keys.p256dh, auth: json.keys.auth } }
          : null,
    };
  } catch {
    // The worker never became ready, or the push manager refused to
    // answer. Nothing to show a switch for.
    return { permission: "unsupported", subscription: null };
  }
};
