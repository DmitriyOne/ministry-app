"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { env } from "@/shared/config";
import { showToast } from "@/shared/ui/sonner";

import { disableUserPush } from "../api/disable-user-push-action";
import { enableUserPush } from "../api/enable-user-push-action";
import { sendTestPush } from "../api/send-test-push-action";
import { readClaimedEndpoint, writeClaimedEndpoint } from "../lib/claimed-endpoint";
import { readPushSubscription } from "../lib/read-push-subscription";
import { PushSubscriptionError, subscribeToPush } from "../lib/subscribe-to-push";
import { unsubscribeFromPush } from "../lib/unsubscribe-from-push";

// "unknown" until the browser has been asked — the switch renders
// disabled rather than guessing a position and then jumping.
export type PushToggleState = "unknown" | "unsupported" | "denied" | "on" | "off";

// What the browser answered last time, kept for the life of the tab.
//
// Without it the switch starts at "unknown" — disabled, position
// unresolved — on every single mount, and the profile is a tab people
// come back to: leaving the screen and returning made the control blink
// and settle again, which reads as the app re-deciding something.
//
// A module-level variable rather than a cache library: this is ONE value,
// read from a browser API rather than from a server, and it lives exactly
// as long as the JavaScript context that read it. React Query would bring
// a provider, a dependency and a second model of "where state lives" to a
// project whose data otherwise comes from Server Components and Server
// Actions — a real cost against a flicker that twelve lines remove.
let lastKnownState: PushToggleState | null = null;

export const usePushToggle = () => {
  const t = useTranslations("notifications.push");
  // Starts from what the tab already learned, so coming back to this
  // screen shows the switch where it was while the browser is asked
  // again in the background.
  const [state, setStateInternal] = useState<PushToggleState>(lastKnownState ?? "unknown");
  const setState = useCallback((next: PushToggleState) => {
    lastKnownState = next;
    setStateInternal(next);
  }, []);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const read = async () => {
      const { permission, subscription } = await readPushSubscription();

      if (!isMounted) return;

      if (permission === "unsupported") {
        setState("unsupported");

        return;
      }

      if (permission === "denied") {
        setState("denied");

        return;
      }

      if (permission !== "granted" || !subscription) {
        setState("off");

        return;
      }

      setState("on");

      // The device is subscribed, but this account may never have claimed
      // it — the usual way that happens is saying yes from the waitlist
      // before having an account at all. Without the claim the switch
      // would say "on" while nothing could address this person.
      //
      // Once per tab, not once per open: the profile is a tab in the
      // bottom navigation, and a server call on every visit is a request
      // that says nothing new in all but the first case. The flag is
      // keyed by endpoint, so a subscription that changes underneath
      // (a new one issued after a re-subscribe) is claimed again.
      if (readClaimedEndpoint() !== subscription.endpoint) {
        void enableUserPush(subscription).then((result) => {
          if (result.status === "success") writeClaimedEndpoint(subscription.endpoint);
        });
      }
    };

    void read();

    return () => {
      isMounted = false;
    };
  }, []);

  const turnOn = useCallback(async () => {
    try {
      // Prompts if the permission has not been answered yet, which is why
      // this may only be reached from a press: iOS allows the prompt once,
      // and only from a real interaction.
      const subscription = await subscribeToPush(
        env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
      );
      const result = await enableUserPush(subscription);

      if (result.status !== "success") {
        showToast({ message: t("saveFailed"), tone: "negative" });

        return;
      }

      setState("on");

      // The proof that it worked, and the only kind that can be trusted:
      // a notification actually arriving on this phone. A toast would only
      // repeat what the switch already shows.
      const test = await sendTestPush({ endpoint: subscription.endpoint });

      if (test.status !== "success") {
        showToast({ message: t("testFailed"), tone: "negative" });
      }
    } catch (error) {
      if (error instanceof PushSubscriptionError && error.code === "permission-denied") {
        // Nothing in the page can undo this — iOS keeps the answer, and
        // only Settings can change it. Saying so is the whole help we
        // can offer.
        setState("denied");

        return;
      }

      showToast({ message: t("saveFailed"), tone: "negative" });
    }
  }, [t]);

  const turnOff = useCallback(async () => {
    const endpoint = await unsubscribeFromPush();

    // The browser is unsubscribed either way, so the switch goes off
    // regardless of what the server says — saying "on" now would be
    // false. A row left behind is harmless: the push service rejects a
    // dead endpoint, and the sender marks it then.
    setState("off");

    if (endpoint) await disableUserPush({ endpoint });

    // Nothing will arrive to say this worked, so the app says it.
    showToast({ message: t("disabled"), tone: "neutral" });
  }, [t]);

  const toggle = useCallback(
    async (next: boolean) => {
      setIsBusy(true);

      try {
        await (next ? turnOn() : turnOff());
      } finally {
        setIsBusy(false);
      }
    },
    [turnOn, turnOff],
  );

  return { state, isBusy, toggle };
};
