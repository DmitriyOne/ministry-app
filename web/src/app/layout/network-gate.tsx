"use client";

import type { ReactNode } from "react";

import {
  type NetworkStatus,
  NetworkReconnectFeedback,
  useNetworkStatus,
  useRefreshOnReconnect,
} from "@/features/network-status";
import { OfflineScreen } from "@/pages/network/offline";
import { ServiceUnavailableScreen } from "@/pages/network/service-unavailable";

type NetworkGateProps = {
  children: ReactNode;
};

type GateScreenProps = {
  retrying: boolean;
  onRetry: () => void;
};

// Which screen replaces the app in which state, as a lookup rather than a
// chain of conditionals — and a TOTAL one, `Record<NetworkStatus, …>`, so
// a fifth status cannot compile until somebody has said what it shows.
// `null` means "show the app", and it is written out for both such states
// instead of being the fall-through: the same reason ROUTE_POLICY lists
// every route (ADR 0050). Both screens take the same two props, which is
// what lets them share one entry shape; they are twins by construction
// (ADR 0055, update), not by coincidence.
const GATE_SCREENS: Record<NetworkStatus, ((props: GateScreenProps) => ReactNode) | null> = {
  // The first probe is still in the air. Nothing is being waited for —
  // the app is already rendered (ADR 0055).
  checking: null,
  online: null,
  offline: OfflineScreen,
  unavailable: ServiceUnavailableScreen,
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

  const handleRetry = () => {
    void retry();
  };

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
  //
  // Two ways for the app to be unusable, two screens, because they ask
  // different things of the person: "check your Wi-Fi" is useless advice
  // when the signal is fine and our own origin is answering 502 — that
  // was the bug (ADR 0055, update).
  const GateScreen = GATE_SCREENS[status];

  const content: ReactNode = GateScreen === null
    ? children
    : <GateScreen retrying={isChecking} onRetry={handleRetry} />;

  return (
    <>
      {content}

      <NetworkReconnectFeedback
        status={status}
      />
    </>
  );
};
