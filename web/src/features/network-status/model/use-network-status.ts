"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { checkConnectivity } from "../api/check-connectivity";
import { NETWORK_CONFIG } from "../config/network-config";

export type NetworkStatus = "checking" | "online" | "offline";

type UseNetworkStatusResult = {
  status: NetworkStatus;
  isChecking: boolean;
  retry: () => Promise<boolean>;
};

export const useNetworkStatus = (): UseNetworkStatusResult => {
  const [status, setStatus] = useState<NetworkStatus>("checking");

  // Raised by `retry` and by nothing else, so the retry button is busy only
  // when the person pressed it. The first load is covered by
  // `status === "checking"`, and the background poll deliberately leaves this
  // alone: it used to flip the button into its disabled "Checking…" state
  // every ten seconds by itself, which reads as a ghost pressing it.
  const [isChecking, setIsChecking] = useState(false);

  // One probe at a time. Reconnecting on iOS fires `online` and
  // `visibilitychange` together, and the offline poll can be due at the same
  // moment, so three probes used to start at once. Every one of them raised
  // the checking flag, and the older ones then returned early as stale —
  // before clearing it — so the flag stayed up until the newest probe
  // finished, which on a slow link means the full five-second timeout. That
  // is the "it says checking twice, then hangs, then clears by itself"
  // behaviour. Later callers now join the probe already running.
  const inFlightRef = useRef<Promise<boolean> | null>(null);

  // Invalidates a result that arrived after the answer stopped mattering —
  // the component unmounted, or `offline` fired while the probe was in the
  // air. It guards the status write only; the checking flag is cleared
  // unconditionally in `finally`, which is what the previous version got
  // wrong.
  const probeIdRef = useRef(0);

  // Never raises the checking flag itself, which is what lets it be called
  // straight from an effect: a function that can set state synchronously
  // there causes the cascading render react-hooks/set-state-in-effect warns
  // about. Raising the flag is `retry`'s job, and it runs from a press.
  const probe = useCallback(async () => {
    if (inFlightRef.current) {
      return inFlightRef.current;
    }

    const probeId = probeIdRef.current;

    const run = (async () => {
      try {
        const reachable = await checkConnectivity();

        if (probeId === probeIdRef.current) {
          setStatus(reachable ? "online" : "offline");
        }

        return reachable;
      } finally {
        inFlightRef.current = null;
      }
    })();

    inFlightRef.current = run;

    return run;
  }, []);

  // The browser saying "offline" is not a guess — skip the probe and believe
  // it, invalidating anything already in the air.
  const markOffline = useCallback(() => {
    probeIdRef.current += 1;
    inFlightRef.current = null;

    setStatus("offline");
  }, []);

  useEffect(() => {
    void probe();

    const handleOffline = () => markOffline();
    const handleOnline = () => void probe();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") void probe();
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      probeIdRef.current += 1;

      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [markOffline, probe]);

  useEffect(() => {
    if (status !== "offline") return;

    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") void probe();
    }, NETWORK_CONFIG.offlineRetryIntervalMs);

    return () => window.clearInterval(interval);
  }, [probe, status]);

  const retry = useCallback(async () => {
    setIsChecking(true);

    try {
      // The probe and the floor run together, so the button is busy for
      // whichever takes longer. An instant answer still reads as "I checked",
      // and a slow one is not padded.
      const [reachable] = await Promise.all([
        probe(),
        new Promise((resolve) => {
          window.setTimeout(resolve, NETWORK_CONFIG.retryFeedbackMinMs);
        }),
      ]);

      return reachable;
    } finally {
      setIsChecking(false);
    }
  }, [probe]);

  return {
    status,
    isChecking,
    retry,
  };
};
