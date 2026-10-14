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

const classifyRejection = async <T>(operation: () => Promise<T>): Promise<T> => {
  try {
    return await operation();
  } catch (error) {
    throw classifyBrowserFailure(error);
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
  const permission = await classifyRejection(() =>
    Notification.requestPermission(),
  );

  if (permission !== "granted") {
    throw new PushSubscriptionError("permission-denied");
  }

  const registration = await classifyRejection(
    () => navigator.serviceWorker.ready,
  );

  let subscription = await classifyRejection(() =>
    registration.pushManager.getSubscription(),
  );

  if (!subscription) {
    subscription = await classifyRejection(() =>
      registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicVapidKey),
      }),
    );
  }

  const serialized = toSerializableSubscription(subscription);

  if (!serialized) {
    throw new PushSubscriptionError("invalid-subscription");
  }

  return serialized;
};
