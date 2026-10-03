"use client";

import { useEffect, useState } from "react";

import { NETWORK_CONFIG } from "../config/network-config";

import type { NetworkStatus } from "./use-network-status";

// "leaving" exists only so the toast can animate out: a component removed
// from the tree the moment it should disappear has nothing left to animate.
// Same shape as the launch gate's phase machine (ADR 0019) — the element is
// in the DOM while it animates and gone afterwards, rather than permanently
// mounted and hidden.
export type ReconnectToastPhase = "hidden" | "pending" | "visible" | "leaving";

type UseReconnectFeedbackResult = {
  phase: ReconnectToastPhase;
  onExited: () => void;
};

export const useReconnectFeedback = (status: NetworkStatus): UseReconnectFeedbackResult => {
  const [phase, setPhase] = useState<ReconnectToastPhase>("hidden");
  const [previousStatus, setPreviousStatus] = useState<NetworkStatus>("checking");

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
    } else if (status === "offline" && phase === "visible") {
      // Dropped back offline while the toast was still up: take it away at
      // once instead of announcing a restored connection over the offline
      // screen. Without this the toast outlives the thing it reports, because
      // the dismissal timer is tied to the phase and the offline→online
      // branch never fires again to clear it.
      setPhase("leaving");
    }
  }

  // The wait before the toast appears. If the connection drops again while
  // this runs, the render-time adjustment above has already put the phase
  // back to "hidden" and this effect's cleanup cancels the timer.
  useEffect(() => {
    if (phase !== "pending") return;

    const timeout = window.setTimeout(
      () => setPhase("visible"),
      NETWORK_CONFIG.reconnectToastDelayMs,
    );

    return () => window.clearTimeout(timeout);
  }, [phase]);

  // Keyed on the phase, not on the status: a second reconnect restarts the
  // clock rather than inheriting whatever was left of the previous one.
  useEffect(() => {
    if (phase !== "visible") return;

    const timeout = window.setTimeout(
      () => setPhase("leaving"),
      NETWORK_CONFIG.reconnectToastDurationMs,
    );

    return () => window.clearTimeout(timeout);
  }, [phase]);

  // The exit animation reports its own end, but it does not always run: under
  // prefers-reduced-motion there is no animation to end, and a backgrounded
  // tab can swallow the event. This timer is what guarantees the toast leaves
  // the DOM either way — the same reasoning as the launch gate's failsafe.
  useEffect(() => {
    if (phase !== "leaving") return;

    const timeout = window.setTimeout(
      () => setPhase("hidden"),
      NETWORK_CONFIG.reconnectToastAnimationMs + 200,
    );

    return () => window.clearTimeout(timeout);
  }, [phase]);

  return {
    phase,
    onExited: () => setPhase("hidden"),
  };
};
