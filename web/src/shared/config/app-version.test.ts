import { describe, expect, it } from "vitest";

import { hasUnreadVersion } from "./app-version";

describe("hasUnreadVersion", () => {
  it("marks someone who has opened nothing", () => {
    expect(hasUnreadVersion(null, "2.0.0")).toBe(true);
    expect(hasUnreadVersion("", "2.0.0")).toBe(true);
  });

  it("marks a version behind the running one", () => {
    expect(hasUnreadVersion("1.9.9", "2.0.0")).toBe(true);
    expect(hasUnreadVersion("2.0.0", "2.0.1")).toBe(true);
    expect(hasUnreadVersion("2.0.9", "2.0.10")).toBe(true);
  });

  it("leaves the marker off once the running version has been read", () => {
    expect(hasUnreadVersion("2.0.0", "2.0.0")).toBe(false);
  });

  // The reason this is a function rather than `!==`: after a rollback the
  // stored version is ahead of the running one, and inequality would light
  // the marker for someone who has read more than is on offer.
  it("stays off after a rollback", () => {
    expect(hasUnreadVersion("2.0.1", "2.0.0")).toBe(false);
    expect(hasUnreadVersion("3.0.0", "2.9.9")).toBe(false);
  });

  it("treats an unparseable version as unread rather than guessing", () => {
    expect(hasUnreadVersion("2.0.0-rc1", "2.0.0")).toBe(true);
    expect(hasUnreadVersion("two", "2.0.0")).toBe(true);
    expect(hasUnreadVersion("2.0.0", "nonsense")).toBe(true);
  });
});
