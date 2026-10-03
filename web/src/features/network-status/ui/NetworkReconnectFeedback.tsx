"use client";

import type { NetworkStatus } from "../model/use-network-status";
import { useReconnectFeedback } from "../model/use-reconnect-feedback";

import { ConnectionRestoredToast } from "./ConnectionRestoredToast";

type NetworkReconnectFeedbackProps = {
  status: NetworkStatus;
};

export const NetworkReconnectFeedback = ({ status }: NetworkReconnectFeedbackProps) => {
  const { phase, onExited } = useReconnectFeedback(status);

  // "pending" is the delay before the toast appears, so nothing is rendered
  // for it either — the element enters the tree already animating.
  if (phase === "hidden" || phase === "pending") {
    return null;
  }

  return <ConnectionRestoredToast isLeaving={phase === "leaving"} onExited={onExited} />;
};
