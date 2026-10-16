"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import type { NetworkStatus } from "./use-network-status";

// What the connection coming back does beyond the toast: ask the server for
// this screen again.
//
// The probe answers one question — is this origin serving — and it asks it
// of /api/v1/health, which touches neither Supabase nor auth on purpose.
// So "online" does not mean the session is still good, and an outage long
// enough to matter is exactly the one that outlives a token (an hour). The
// person was looking at a screen rendered before it; without this they go
// on looking at it until something makes them navigate, and the first thing
// they tap fails instead.
//
// router.refresh() re-requests the current route's RSC payload, which runs
// the proxy and the screen's own session read again — so a session that died
// during the outage now ends in a redirect to /login rather than in a
// screen that cannot do anything. It keeps client state (a half-typed
// form), which a reload would throw away.
//
// Only on the offline → online edge. Not on "checking → online" (that is
// the first load, which just rendered) and not on a repeat probe while
// already online (there is nothing new to learn, and refreshing on a timer
// would re-render the app under the person's hands). The effect depends on
// `status`, so it does not even run between those edges.
export const useRefreshOnReconnect = (status: NetworkStatus): void => {
  const router = useRouter();
  // A ref, not state: the previous status is only ever read inside the
  // effect below, and nothing renders differently because of it. Keeping it
  // in state would mean setting state from an effect, which React warns
  // about (react-hooks/set-state-in-effect) — useReconnectFeedback can
  // adjust state during render because its value DOES change what it
  // renders; this hook renders nothing.
  const previousStatus = useRef<NetworkStatus>("checking");

  useEffect(() => {
    const previous = previousStatus.current;

    previousStatus.current = status;

    // Any unusable state coming back, not just "offline": a deployment
    // that was answering 503 has very likely just been replaced, which is
    // the most stale a screen can be.
    const wasUnusable = previous === "offline" || previous === "unavailable";

    if (wasUnusable && status === "online") router.refresh();
  }, [status, router]);
};
