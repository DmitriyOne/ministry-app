"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { dismissToast, showToast, type ToastId } from "@/shared/ui/sonner";

import { NETWORK_CONFIG } from "../config/network-config";

import { isUsable, type NetworkStatus, type ReconnectToastKind, resolveReconnectToast } from "./network-state";

// When to announce a restored connection, and which of the two sentences
// to use — the decision itself is `resolveReconnectToast` (model/
// network-state.ts, with tests); what lives here is the timing: the
// delay that debounces a flapping link, and taking the toast away again
// if the app becomes unusable while it is still up. How the toast looks
// and when it leaves is the shared toast's job.

export const useReconnectFeedback = (status: NetworkStatus) => {
  const t = useTranslations("common");
  // Resolved during render, so the effect below depends on a string rather
  // than on whatever identity useTranslations hands back. If `t` were in the
  // dependency array and its identity changed between renders, the delay
  // timer would be cancelled and restarted on every render while a toast is
  // pending — and the toast could end up never appearing. A string
  // compares by value, so that question does not arise.
  const connectionRestored = t("connectionRestored");
  const serviceRestored = t("serviceRestored");
  // Which toast is waiting to be shown, or null for none. It carries the
  // kind rather than a bare "pending" flag so the message is chosen from
  // the edge that was actually crossed, not from the status now (which is
  // "online" either way by the time the timer fires).
  const [pending, setPending] = useState<ReconnectToastKind | null>(null);
  const [previousStatus, setPreviousStatus] = useState<NetworkStatus>("checking");
  // The id of the toast this hook last showed, so it can be taken away again.
  const toastId = useRef<ToastId | null>(null);

  // Adjusted during render rather than in an effect. This is not
  // synchronisation with anything outside React — it is state derived from a
  // prop changing, which React handles by comparing against the previous
  // value and setting state while rendering. An effect here would render
  // once with the stale value and again with the right one, which is what
  // react-hooks/set-state-in-effect warns about.
  if (status !== previousStatus) {
    setPreviousStatus(status);

    const kind = resolveReconnectToast(previousStatus, status);

    // Not shown yet — a pending toast waits out reconnectToastDelayMs
    // first. A connection that comes back and drops again inside that
    // second never produces a toast at all, which is what stops a
    // flapping link from flashing one per flap.
    if (kind !== null) setPending(kind);
    else if (!isUsable(status) && pending !== null) setPending(null);
  }

  const message = pending === "service" ? serviceRestored : connectionRestored;

  // The wait before the toast appears. If the app becomes unusable again
  // while this runs, the render-time adjustment above has already cleared
  // the pending kind and this effect's cleanup cancels the timer. Showing
  // happens here, in a timer, never during render, since a toast is a side effect.
  useEffect(() => {
    if (pending === null) return;

    const timeout = window.setTimeout(() => {
      toastId.current = showToast({
        message,
        tone: "positive",
        durationMs: NETWORK_CONFIG.reconnectToastDurationMs,
      });
      setPending(null);
    }, NETWORK_CONFIG.reconnectToastDelayMs);

    return () => window.clearTimeout(timeout);
  }, [pending, message]);

  // Became unusable again while the toast was still up: take it away at
  // once instead of announcing a restored connection over the offline
  // screen. The shared toast would otherwise sit out its own timer.
  // Dismissing an id that has already left is harmless, so no bookkeeping
  // is needed for the case where it expired by itself.
  useEffect(() => {
    if (isUsable(status) || toastId.current === null) return;

    dismissToast(toastId.current);
    toastId.current = null;
  }, [status]);
};
