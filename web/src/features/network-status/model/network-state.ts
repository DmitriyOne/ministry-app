import type { ConnectivityOutcome } from "../api/check-connectivity";

// What the app knows about reaching its own origin.
//
// "unavailable" is the origin answering that it is broken, which is not
// the same screen as no connection at all (ADR 0055, update): one is the
// person's to fix, the other is ours.
export type NetworkStatus = "checking" | "online" | "offline" | "unavailable";

// Which toast a recovery earns. Not cosmetic: "You're back online" is a
// lie to somebody whose signal never dropped and whose app was simply
// answering 503.
export type ReconnectToastKind = "connection" | "service";

// Every decision the network hooks make, as functions with no React in
// them. The hooks hold the timers, the listeners and the state; what to
// conclude lives here, where a test can ask it directly — the same split
// the project already uses for resolveGate, isNavItemCurrent and
// resolveSplashDelay.
const STATUS_BY_OUTCOME: Record<ConnectivityOutcome, NetworkStatus> = {
  reachable: "online",
  unreachable: "unavailable",
  offline: "offline",
};

export const statusForOutcome = (outcome: ConnectivityOutcome): NetworkStatus =>
  STATUS_BY_OUTCOME[outcome];

// A total map, not a list of the bad cases: a fifth status would fail to
// compile here rather than quietly fall into "the app is fine".
const USABLE: Record<NetworkStatus, boolean> = {
  // The first probe is still in the air, and the app is rendered while it
  // flies — there is no waiting screen (ADR 0055).
  checking: true,
  online: true,
  offline: false,
  unavailable: false,
};

export const isUsable = (status: NetworkStatus): boolean => USABLE[status];

// Keep asking while the app cannot be used. A deployment answering 503
// comes back on its own exactly as a connection does, so the person
// should not have to discover that this screen, unlike the offline one,
// needs the button pressed.
//
// "checking" is excluded for a different reason than "online": there is
// already a probe in flight, and a second timer would only race it.
export const shouldPoll = (status: NetworkStatus): boolean =>
  status !== "online" && status !== "checking";

// Did the app just become usable again after not being? Any unusable
// state counts, not only "offline" — a deployment that was answering 503
// has very likely just been replaced, which is the most stale a rendered
// screen can be.
//
// "checking → online" is not a recovery: that is the first load, which
// has only just rendered.
export const hasRecovered = (previous: NetworkStatus, next: NetworkStatus): boolean =>
  next === "online" && previous !== "online" && previous !== "checking";

// Which sentence a recovery deserves, or null for no toast at all. The
// kind is decided from the edge that was crossed, because by the time the
// toast is shown the status is "online" either way.
export const resolveReconnectToast = (
  previous: NetworkStatus,
  next: NetworkStatus,
): ReconnectToastKind | null => {
  if (!hasRecovered(previous, next)) return null;

  return previous === "offline" ? "connection" : "service";
};
