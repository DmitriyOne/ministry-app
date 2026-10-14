"use client";

import type { ReactNode } from "react";

import {
  NetworkReconnectFeedback,
  useNetworkStatus,
  useRefreshOnReconnect,
} from "@/features/network-status";
import { OfflineScreen } from "@/pages/offline";

type NetworkGateProps = {
  children: ReactNode;
  checking: ReactNode;
};

export const NetworkGate = ({ children, checking }: NetworkGateProps) => {
  const {
    status,
    isChecking,
    retry,
  } = useNetworkStatus();

  // The connection coming back re-renders this screen from the server, so a
  // session that expired during the outage is noticed now rather than at
  // the first tap (see the hook for why "online" says nothing about the
  // session).
  useRefreshOnReconnect(status);

  let content: ReactNode;

  if (status === "checking") {
    content = (
      <main
        role="status"
        aria-live="polite"
        className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background"
      >
        {checking}
      </main>
    );
  } else if (status === "offline") {
    content = (
      <OfflineScreen
        retrying={isChecking}
        onRetry={() => {
          void retry();
        }}
      />
    );
  } else {
    content = children;
  }

  return (
    <>
      {content}

      <NetworkReconnectFeedback
        status={status}
      />
    </>
  );
};
