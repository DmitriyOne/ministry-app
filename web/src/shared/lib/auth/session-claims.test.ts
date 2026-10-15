import { describe, expect, it } from "vitest";

import { DEFAULT_APP_ROLE, parseSessionClaims } from "./session-claims";

describe("parseSessionClaims", () => {
  it("reads the role the hook put into the claims", () => {
    expect(parseSessionClaims({ sub: "abc", user_role: "admin" })).toEqual({
      userId: "abc",
      role: "admin",
    });
  });

  // A person whose user_roles row was removed by hand still signs in
  // (the hook returns claims without user_role), and must land on the
  // least privileged role rather than crash the request.
  it("falls back to the default role when the claim is absent", () => {
    expect(parseSessionClaims({ sub: "abc" })).toEqual({
      userId: "abc",
      role: DEFAULT_APP_ROLE,
    });
  });

  it("falls back to the default role when the claim is not a known role", () => {
    expect(parseSessionClaims({ sub: "abc", user_role: "root" })).toEqual({
      userId: "abc",
      role: DEFAULT_APP_ROLE,
    });
  });

  // No subject means this is not a session we can attribute to anyone.
  it("returns null when there is no subject", () => {
    expect(parseSessionClaims({ user_role: "admin" })).toBeNull();
    expect(parseSessionClaims(null)).toBeNull();
    expect(parseSessionClaims("nonsense")).toBeNull();
  });
});
