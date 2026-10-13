"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { env } from "@/shared/config";
import { showToast } from "@/shared/ui/sonner";

import { disableUserPush } from "../api/disable-user-push-action";
import { enableUserPush } from "../api/enable-user-push-action";
import { readPushSubscription } from "../lib/read-push-subscription";
import { PushSubscriptionError, subscribeToPush } from "../lib/subscribe-to-push";
import { unsubscribeFromPush } from "../lib/unsubscribe-from-push";

// "unknown" until the browser has been asked — the switch renders
// disabled rather than guessing a position and then jumping.
export type PushToggleState = "unknown" | "unsupported" | "denied" | "on" | "off";

export const usePushToggle = () => {
  const t = useTranslations("notifications.push");
  const [state, setState] = useState<PushToggleState>("unknown");
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
      // before having an account at all. Claiming is an upsert on the
      // endpoint, so doing it on every open is free, and without it the
      // switch would say "on" while nothing could address this person.
      void enableUserPush(subscription);
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
  }, []);

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
