import * as Sentry from "@sentry/nextjs";

import {
  canUseWebPush,
  toSerializableSubscription,
  type SerializablePushSubscription,
} from "./push-capability";
import { urlBase64ToUint8Array } from "./url-base64-to-uint8-array";

export type { SerializablePushSubscription };

export type PushSubscriptionFailure
  = | "unsupported"
    | "permission-denied"
    | "invalid-subscription"
    | "subscription-failed";

export class PushSubscriptionError extends Error {
  constructor(public readonly code: PushSubscriptionFailure) {
    super(code);
    this.name = "PushSubscriptionError";
  }
}

// Which browser call was being made, for the report below. "The switch
// did not turn on" is otherwise all anybody ever learns: the hooks above
// branch on `permission-denied` and `unsupported`, and everything else
// becomes one generic state on screen.
type SubscribeStep
  = | "permission"
    | "service-worker"
    | "existing-subscription"
    | "subscribe"
    | "serialise";

// Two of the four failures are ANSWERS, not faults: the person said no
// (`permission-denied`), or this browser cannot do push at all
// (`unsupported`). Both are expected, both are shown on screen, and
// neither is reported — the quota belongs to the other two.
//
// `subscription-failed` and `invalid-subscription` are the ones worth
// waking up for. The first is "the browser or the push service refused
// and we do not know why" (an unreachable Apple/Mozilla push endpoint, an
// aborted registration, a service worker that never became ready); the
// second is a subscription handed back without the keys needed to send to
// it. Until now both went nowhere at all: the error was classified,
// rethrown, caught by the hook, turned into a state, and that was the end
// of it — so "I tapped it and it just says it failed" had no counterpart
// anywhere we could read.
//
// Client-side Sentry, like the what's-new store (ADR 0057): the failure
// happens in the browser and there is no server call to hang it on. The
// step is a tag so the four causes can be told apart, and the DOMException
// goes in whole — `beforeSend` scrubs it (ADR 0041). Sentry is off outside
// production, so locally the console line is all there is.
const report = (error: unknown, step: SubscribeStep, code: PushSubscriptionFailure): void => {
  console.warn("[push-notifications] could not subscribe", {
    step,
    code,
    error: error instanceof Error ? `${error.name}: ${error.message}` : typeof error,
  });

  Sentry.captureException(error, {
    level: "error",
    tags: { scope: "push-subscribe", step, code },
  });
};

// Why this exists: once an error has been flattened into a generic failure,
// the caller cannot tell a blocked permission from a network failure, and
// those two deserve different messages. The browser rejects the awaited
// calls below with a raw DOMException; NotAllowedError is how
// pushManager.subscribe() reports permission blocked at the system level.
// Anything else (push service unreachable, aborted, ...) is a failure to
// subscribe. A PushSubscriptionError is never re-wrapped.
const classifyBrowserFailure = (error: unknown): PushSubscriptionError => {
  if (error instanceof PushSubscriptionError) {
    return error;
  }

  if (error instanceof DOMException && error.name === "NotAllowedError") {
    return new PushSubscriptionError("permission-denied");
  }

  return new PushSubscriptionError("subscription-failed");
};

const classifyRejection = async <T>(
  step: SubscribeStep,
  operation: () => Promise<T>,
): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    const failure = classifyBrowserFailure(error);

    // Reported here rather than at the call site: this is the one place
    // that still holds the original rejection, and the one that knows
    // whether the outcome was an answer or a fault.
    if (failure.code === "subscription-failed") report(error, step, failure.code);

    throw failure;
  }
};

export const subscribeToPush = async (
  publicVapidKey: string,
): Promise<SerializablePushSubscription> => {
  // Shared with readPushSubscription (push-capability.ts) so the prompt
  // is never spent on a browser the switch considers unsupported.
  if (!canUseWebPush()) {
    throw new PushSubscriptionError("unsupported");
  }

  // Must be reached from the user's explicit button press. iOS/iPadOS
  // Home Screen web apps require a direct user interaction before this
  // permission prompt may be shown.
  const permission = await classifyRejection("permission", () =>
    Notification.requestPermission(),
  );

  if (permission !== "granted") {
    throw new PushSubscriptionError("permission-denied");
  }

  const registration = await classifyRejection(
    "service-worker",
    () => navigator.serviceWorker.ready,
  );

  let subscription = await classifyRejection("existing-subscription", () =>
    registration.pushManager.getSubscription(),
  );

  if (!subscription) {
    subscription = await classifyRejection("subscribe", () =>
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      }),
    );
  }

  const serialized = toSerializableSubscription(subscription);

  if (!serialized) {
    // A subscription with no endpoint or no keys: nothing can ever be
    // sent to it, and the switch would otherwise go on claiming to work.
    const failure = new PushSubscriptionError("invalid-subscription");

    report(failure, "serialise", failure.code);

    throw failure;
  }

  return serialized;
};
