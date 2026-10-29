import { describe, expect, it } from "vitest";

import { resolveGate } from "@/shared/lib/auth";

import { ROUTE_POLICY, resolveRoutePolicy } from "./route-policy";
import { routes } from "./routes";

// These are invariants of the map itself, not of any one screen. Each
// one, if broken, breaks the app in a way that is hard to read back from
// the symptom — an endless redirect, or a screen with no shield at all.
describe("ROUTE_POLICY", () => {
  it("classifies every address in routes.ts", () => {
    // The type already guarantees this (Record<AppRoute, RoutePolicy>),
    // but only for a key written as a literal: an entry added with a
    // computed key would type-check and be absent at runtime.
    for (const pathname of Object.values(routes)) {
      expect(resolveRoutePolicy(pathname), pathname).not.toBeNull();
    }
  });

  // Shielding a blocked-device screen would redirect the device to the
  // very screen it is already on, over and over.
  it("does not put the device shield on the screens the shield redirects to", () => {
    for (const pathname of [
      routes.accessDesktop,
      routes.accessAndroid,
      routes.accessIosBrowser,
    ]) {
      expect(ROUTE_POLICY[pathname].deviceShield, pathname).toBe(false);
    }
  });

  // Where the gate sends people must itself be reachable in the state it
  // sends them in. Checked through resolveGate rather than by reading the
  // map, because the pair is the thing that loops.
  it("sends people only to addresses that will have them", () => {
    // No session → /login, which must not require one.
    expect(resolveGate({ pathname: routes.login, hasSession: false })).toEqual({
      action: "pass",
    });
    // Session but wrong screen → /day, which must not forbid a session.
    expect(resolveGate({ pathname: routes.day, hasSession: true })).toEqual({ action: "pass" });
    // Signed in but not an admin → /profile, which must not be admin-only.
    expect(resolveGate({ pathname: routes.profile, hasSession: true, role: "user" })).toEqual({
      action: "pass",
    });
  });

  // An address that needs a session must also be the kind of address the
  // proxy actually looks at: without the device shield it is outside the
  // set the proxy classifies, and the pair would contradict itself.
  it("keeps the device shield on every address that needs a session", () => {
    for (const [pathname, policy] of Object.entries(ROUTE_POLICY)) {
      if (policy.session === "any" && !policy.adminOnly) continue;

      expect(policy.deviceShield, pathname).toBe(true);
    }
  });

  // A plain object lookup would answer these with something inherited from
  // Object.prototype — a truthy "policy" with every field undefined, which
  // reads as "no shield, nothing required".
  it("treats an inherited property name as an unknown address", () => {
    for (const pathname of ["constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(resolveRoutePolicy(pathname), pathname).toBeNull();
    }
  });

  // Every /day carries its date, so this family is the address people
  // actually use — and an unclassified address is one the proxy leaves
  // alone: no device shield, no session, no home-screen icon. The screen
  // would have opened in an ordinary Safari tab, which is the exact way
  // /admin/users/new shipped broken once (ADR 0050).
  it("shields a day under its own date like the bare /day", () => {
    for (const pathname of ["/day/2026-06-02", "/day/2025-12-31"]) {
      expect(resolveRoutePolicy(pathname), pathname).toEqual(ROUTE_POLICY[routes.day]);
    }
  });

  // A prefix without the separator is a coincidence of spelling, not a
  // family: an address nobody has classified must stay unclassified, or
  // a typo gets the app's own policy.
  it("does not adopt an address that merely starts with the same letters", () => {
    for (const pathname of ["/dayz", "/day-summary", "/days/2026-06-02"]) {
      expect(resolveRoutePolicy(pathname), pathname).toBeNull();
    }
  });

  it("asks for the home-screen icon on no address that opens in a tab", () => {
    // The public side is reached BEFORE the app is installed, so
    // requiring the icon there would make it unreachable.
    for (const pathname of [routes.soon, routes.install, routes.about, routes.privacy]) {
      expect(ROUTE_POLICY[pathname].launchGate, pathname).toBe(false);
    }
  });
});
