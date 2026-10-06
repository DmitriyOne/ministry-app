"use client";

import type { NetworkStatus } from "../model/use-network-status";
import { useReconnectFeedback } from "../model/use-reconnect-feedback";

type NetworkReconnectFeedbackProps = {
  status: NetworkStatus;
};

// Renders nothing itself: the toast is drawn by the app-wide Toaster,
// this only decides when to ask for it.
export const NetworkReconnectFeedback = ({ status }: NetworkReconnectFeedbackProps) => {
  useReconnectFeedback(status);

  return null;
};
