import { describe, expect, it } from "vitest";

import { hasRole } from "./has-role";

describe("hasRole", () => {
  it("matches the role the person actually has", () => {
    expect(hasRole({ userId: "a", role: "admin" }, "admin")).toBe(true);
    expect(hasRole({ userId: "a", role: "user" }, "user")).toBe(true);
  });

  // admin is not a superset of user by design: v2 has no permission
  // hierarchy (no role_permissions table — ADR 0044), so a check asks
  // about one role and gets an answer about that role only.
  it("does not treat admin as a superset of user", () => {
    expect(hasRole({ userId: "a", role: "admin" }, "user")).toBe(false);
  });

  it("is false without a session", () => {
    expect(hasRole(null, "user")).toBe(false);
  });
});
