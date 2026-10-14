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
};

export const NetworkGate = ({ children }: NetworkGateProps) => {
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

  // "checking" renders the app, not a waiting screen. It used to render a
  // spinner, which meant the first paint of every launch was a spinner and
  // the real screen waited for hydration plus a round trip to
  // /api/v1/health — on a static page, the whole point of it being static.
  // Nothing is actually being waited for: check-connectivity answers
  // immediately when navigator.onLine is false, so a genuinely offline
  // device reaches the branch below within a tick. The 5s timeout only
  // applies to the online-but-unreachable case, and holding the app
  // hostage for five seconds on the chance of that is the wrong trade
  // (release review, 2026-10-14 — ADR 0055).
  const content: ReactNode = status === "offline"
    ? (
        <OfflineScreen
          retrying={isChecking}
          onRetry={() => {
            void retry();
          }}
        />
      )
    : children;

  return (
    <>
      {content}

      <NetworkReconnectFeedback
        status={status}
      />
    </>
  );
};
