import { describe, expect, it } from "vitest";

import type { ConnectivityOutcome } from "../api/check-connectivity";

import {
  hasRecovered,
  isUsable,
  type NetworkStatus,
  resolveReconnectToast,
  shouldPoll,
  statusForOutcome,
} from "./network-state";

const STATUSES: NetworkStatus[] = ["checking", "online", "offline", "unavailable"];

describe("statusForOutcome", () => {
  // The bug this guards: one boolean meant both "nothing answered" and
  // "our origin answered that it is broken", so a 502 from the
  // deployment showed "check your Wi-Fi" on a phone with full signal.
  it("keeps a dead connection and a broken origin apart", () => {
    expect(statusForOutcome("offline")).toBe("offline");
    expect(statusForOutcome("unreachable")).toBe("unavailable");
  });

  it("maps a reachable origin to online", () => {
    expect(statusForOutcome("reachable")).toBe("online");
  });

  it("answers every outcome the probe can return", () => {
    const outcomes: ConnectivityOutcome[] = ["reachable", "unreachable", "offline"];

    for (const outcome of outcomes) {
      expect(STATUSES).toContain(statusForOutcome(outcome));
    }
  });
});

describe("isUsable", () => {
  it("renders the app while the first probe is still in the air", () => {
    expect(isUsable("checking")).toBe(true);
  });

  it("replaces the app in both unusable states", () => {
    expect(isUsable("offline")).toBe(false);
    expect(isUsable("unavailable")).toBe(false);
  });
});

describe("shouldPoll", () => {
  // The whole point of the change: the 503 screen used to be a dead end,
  // because only "offline" polled.
  it("polls in both unusable states", () => {
    expect(shouldPoll("offline")).toBe(true);
    expect(shouldPoll("unavailable")).toBe(true);
  });

  it("does not poll once the origin is serving", () => {
    expect(shouldPoll("online")).toBe(false);
  });

  it("does not add a timer while a probe is already in flight", () => {
    expect(shouldPoll("checking")).toBe(false);
  });
});

describe("hasRecovered", () => {
  it("is true coming back from either unusable state", () => {
    expect(hasRecovered("offline", "online")).toBe(true);
    expect(hasRecovered("unavailable", "online")).toBe(true);
  });

  // This is what stops router.refresh() from firing on every launch.
  it("is false on the first load", () => {
    expect(hasRecovered("checking", "online")).toBe(false);
  });

  it("is false on a repeat probe while already online", () => {
    expect(hasRecovered("online", "online")).toBe(false);
  });

  it("is false while the app is still unusable", () => {
    expect(hasRecovered("offline", "unavailable")).toBe(false);
    expect(hasRecovered("online", "offline")).toBe(false);
  });
});

describe("resolveReconnectToast", () => {
  it("announces a connection only to somebody whose connection dropped", () => {
    expect(resolveReconnectToast("offline", "online")).toBe("connection");
  });

  it("announces the app being back when the origin was the problem", () => {
    expect(resolveReconnectToast("unavailable", "online")).toBe("service");
  });

  it("says nothing on the first load or without a recovery", () => {
    expect(resolveReconnectToast("checking", "online")).toBeNull();
    expect(resolveReconnectToast("online", "online")).toBeNull();
    expect(resolveReconnectToast("online", "offline")).toBeNull();
  });

  // Every pair, so a future status cannot silently produce a toast that
  // claims a connection came back when it did not.
  it("only ever answers for a transition into online", () => {
    for (const previous of STATUSES) {
      for (const next of STATUSES) {
        if (next === "online") continue;

        expect(resolveReconnectToast(previous, next)).toBeNull();
      }
    }
  });
});
