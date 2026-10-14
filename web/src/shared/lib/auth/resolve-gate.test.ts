import { describe, expect, it } from "vitest";

import { resolveGate } from "./resolve-gate";

describe("resolveGate", () => {
  it("sends a visitor with no session to the login screen", () => {
    expect(resolveGate({ pathname: "/day", hasSession: false })).toEqual({
      action: "redirect",
      to: "/login",
    });
  });

  it("lets a signed-in person through to an app screen", () => {
    expect(resolveGate({ pathname: "/day", hasSession: true })).toEqual({
      action: "pass",
    });
  });

  // The cycle this guards against: /login redirects to /day, which
  // redirects back to /login (Review Focus 3). Both directions are
  // asserted so neither can be introduced alone.
  it("sends a signed-in person away from the login screen", () => {
    expect(resolveGate({ pathname: "/login", hasSession: true })).toEqual({
      action: "redirect",
      to: "/day",
    });
  });

  it("never redirects the login screen to itself", () => {
    expect(resolveGate({ pathname: "/login", hasSession: false })).toEqual({
      action: "pass",
    });
  });

  it("treats the password reset screen like the login screen", () => {
    expect(resolveGate({ pathname: "/forgot-password", hasSession: false })).toEqual({
      action: "pass",
    });
    expect(resolveGate({ pathname: "/forgot-password", hasSession: true })).toEqual({
      action: "redirect",
      to: "/day",
    });
  });

  // The role travels in the token, so the proxy can decide an admin path
  // without asking the auth server (ADR 0044). All four combinations are
  // asserted: this is the first place in the app where a role decides
  // anything, and "forgot to check" looks exactly like "checked and
  // allowed" from the outside.
  it("opens an admin path only for an admin", () => {
    expect(resolveGate({ pathname: "/admin/users/new", hasSession: true, role: "admin" }))
      .toEqual({ action: "pass" });
  });

  it("sends a signed-in non-admin away from an admin path", () => {
    // /profile, not /login: they are signed in, so /login would bounce
    // them straight back and the two rules would form a loop.
    expect(resolveGate({ pathname: "/admin/users/new", hasSession: true, role: "user" }))
      .toEqual({ action: "redirect", to: "/profile" });
  });

  it("treats a missing role on an admin path as not an admin", () => {
    expect(resolveGate({ pathname: "/admin/users/new", hasSession: true }))
      .toEqual({ action: "redirect", to: "/profile" });
  });

  it("sends a visitor with no session on an admin path to the login screen", () => {
    expect(resolveGate({ pathname: "/admin/users/new", hasSession: false }))
      .toEqual({ action: "redirect", to: "/login" });
  });

  // /soon is the public landing now that LAUNCH_MODE is gone (ADR 0045):
  // no session needed, and a signed-in person is not bounced off it.
  it("leaves the public landing alone either way", () => {
    expect(resolveGate({ pathname: "/soon", hasSession: false })).toEqual({
      action: "pass",
    });
    expect(resolveGate({ pathname: "/soon", hasSession: true })).toEqual({
      action: "pass",
    });
  });

  it("leaves the public documents alone either way", () => {
    for (const pathname of ["/about", "/privacy", "/install"]) {
      expect(resolveGate({ pathname, hasSession: false })).toEqual({ action: "pass" });
      expect(resolveGate({ pathname, hasSession: true })).toEqual({ action: "pass" });
    }
  });

  // An address this app does not own is not the gate's business: the
  // proxy leaves it alone so Next.js can answer with a real 404.
  it("leaves an unknown address alone", () => {
    expect(resolveGate({ pathname: "/qwerty", hasSession: false })).toEqual({ action: "pass" });
  });

  // The whole /admin family is gated, not just the one path that has a
  // route constant today. A screen added under /admin is shielded from
  // its first request rather than from the commit that remembers to list
  // it — which is the mistake that already shipped once (the screen was
  // missing from LaunchGate's list of app screens).
  it("gates an admin path that is not in the route map", () => {
    for (const pathname of ["/admin", "/admin/users", "/admin/users/42/edit"]) {
      expect(resolveGate({ pathname, hasSession: false })).toEqual({
        action: "redirect",
        to: "/login",
      });
      expect(resolveGate({ pathname, hasSession: true, role: "user" })).toEqual({
        action: "redirect",
        to: "/profile",
      });
      expect(resolveGate({ pathname, hasSession: true, role: "admin" })).toEqual({
        action: "pass",
      });
    }
  });
});
