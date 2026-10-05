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
});
