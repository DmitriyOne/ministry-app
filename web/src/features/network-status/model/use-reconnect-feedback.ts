"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { dismissToast, showToast, type ToastId } from "@/shared/ui/sonner";

import { NETWORK_CONFIG } from "../config/network-config";

import type { NetworkStatus } from "./use-network-status";

// Only the decision of whether to announce a restored connection lives here.
// How the toast looks, animates and when it leaves is the shared toast's job.
export type ReconnectToastPhase = "hidden" | "pending";

export const useReconnectFeedback = (status: NetworkStatus) => {
  const t = useTranslations("common");
  // Resolved during render, so the effect below depends on a string rather
  // than on whatever identity useTranslations hands back. If `t` were in the
  // dependency array and its identity changed between renders, the delay
  // timer would be cancelled and restarted on every render while the phase
  // is "pending" — and the toast could end up never appearing. A string
  // compares by value, so that question does not arise.
  const message = t("connectionRestored");
  const [phase, setPhase] = useState<ReconnectToastPhase>("hidden");
  const [previousStatus, setPreviousStatus] = useState<NetworkStatus>("checking");
  // The id of the toast this hook last showed, so it can be taken away again.
  const toastId = useRef<ToastId | null>(null);

  // Adjusted during render rather than in an effect. This is not
  // synchronisation with anything outside React — it is state derived from a
  // prop changing, which React handles by comparing against the previous
  // value and setting state while rendering. An effect here would render
  // once with the stale phase and again with the right one, which is what
  // react-hooks/set-state-in-effect warns about.
  if (status !== previousStatus) {
    setPreviousStatus(status);

    if (previousStatus === "offline" && status === "online") {
      // Not shown yet — "pending" waits out reconnectToastDelayMs first. A
      // connection that comes back and drops again inside that second never
      // produces a toast at all, which is what stops a flapping link from
      // flashing one per flap.
      setPhase("pending");
    } else if (status === "offline" && phase === "pending") {
      setPhase("hidden");
    }
  }

  // The wait before the toast appears. If the connection drops again while
  // this runs, the render-time adjustment above has already put the phase
  // back to "hidden" and this effect's cleanup cancels the timer. Showing
  // happens here, in a timer, never during render, since a toast is a side effect.
  useEffect(() => {
    if (phase !== "pending") return;

    const timeout = window.setTimeout(() => {
      toastId.current = showToast({
        message,
        tone: "positive",
        durationMs: NETWORK_CONFIG.reconnectToastDurationMs,
      });
      setPhase("hidden");
    }, NETWORK_CONFIG.reconnectToastDelayMs);

    return () => window.clearTimeout(timeout);
  }, [phase, message]);

  // Dropped back offline while the toast was still up: take it away at once
  // instead of announcing a restored connection over the offline screen. The
  // shared toast would otherwise sit out its own timer. Dismissing an id
  // that has already left is harmless, so no bookkeeping is needed for the
  // case where it expired by itself.
  useEffect(() => {
    if (status !== "offline" || toastId.current === null) return;

    dismissToast(toastId.current);
    toastId.current = null;
  }, [status]);
};
