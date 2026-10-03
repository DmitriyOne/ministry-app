"use client";

import type { ReactNode } from "react";

import {
  NetworkReconnectFeedback,
  useNetworkStatus,
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
