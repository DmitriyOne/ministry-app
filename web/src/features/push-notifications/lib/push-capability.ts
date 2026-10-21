import { isStandaloneDisplayMode } from "@/shared/lib/browser";

// The shape the server stores and sends with: endpoint plus both keys.
// A subscription missing either key cannot be sent to, so the readers
// below treat it as no subscription at all.
export type SerializablePushSubscription = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

// Whether this browser can do Web Push at all.
//
// One copy on purpose. subscribeToPush (which prompts) and
// readPushSubscription (which only reports) have to answer this
// identically: if they ever disagree, the profile switch shows "off"
// while a subscription exists, or — worse — the app spends the iOS
// permission prompt, which is one-shot, on a browser that was never
// going to deliver.
//
// The standalone check is the part that is easy to forget: on iOS the
// three APIs below exist in an ordinary Safari tab, and the subscription
// fails only afterwards, with the prompt already spent.
export const canUseWebPush = (): boolean =>
  "serviceWorker" in navigator
  && "PushManager" in window
  && "Notification" in window
  && isStandaloneDisplayMode();

// Turns what the push manager hands back into the stored shape, or null
// when it is unusable. Also one copy, for the same reason: both callers
// must agree on what counts as having a subscription.
export const toSerializableSubscription = (
  subscription: PushSubscription | null | undefined,
): SerializablePushSubscription | null => {
  const json = subscription?.toJSON();

  if (!json?.endpoint || !json.keys?.p256dh || !json.keys.auth) return null;

  return {
    endpoint: json.endpoint,
    keys: {
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
    },
  };
};
