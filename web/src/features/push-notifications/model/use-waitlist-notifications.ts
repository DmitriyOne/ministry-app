"use client";

import { useEffect, useState, useTransition } from "react";

import { env } from "@/shared/config";
import { isStandaloneDisplayMode } from "@/shared/lib/device";

import { registerPushSubscription } from "../api/register-push-subscription-action";
import {
  PushSubscriptionError,
  subscribeToPush,
} from "../lib/subscribe-to-push";

export type WaitlistNotificationsStatus
  = | "idle"
    | "enabled"
    | "denied"
    | "unsupported"
    | "error";

export const useWaitlistNotifications = (enrollmentToken: string) => {
  const [status, setStatus] = useState<WaitlistNotificationsStatus>("idle");
  const [isPending, startTransition] = useTransition();
  // null until mounted: matchMedia does not exist on the server, so both
  // server and first client render show nothing (no hydration mismatch).
  // The check runs in a microtask for the same lint reason as
  // use-launch-gate.ts.
  const [isStandalone, setIsStandalone] = useState<boolean | null>(null);

  useEffect(() => {
    queueMicrotask(() => setIsStandalone(isStandaloneDisplayMode()));
  }, []);

  // Called straight from the button's press handler, never from an effect:
  // iOS requires a direct user interaction for the permission prompt.
  const enable = async () => {
    try {
      const subscription = await subscribeToPush(
        env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
      );

      startTransition(async () => {
        const result = await registerPushSubscription({
          enrollmentToken,
          subscription,
        });

        setStatus(result.status === "success" ? "enabled" : "error");
      });
    } catch (error) {
      if (error instanceof PushSubscriptionError) {
        if (error.code === "permission-denied") {
          setStatus("denied");
          return;
        }

        if (error.code === "unsupported") {
          setStatus("unsupported");
          return;
        }
      }

      // "subscription-failed" and "invalid-subscription" share the
      // generic message.
      setStatus("error");
    }
  };

  return { status, isPending, isStandalone, enable };
};
