import { describe, expect, it } from "vitest";

import { hasUnreadVersion, showsUnreadDot } from "./app-version";

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

describe("showsUnreadDot", () => {
  // The first bug, in the form it was reported: read the release notes,
  // swipe back to the profile, and the dot is still there. The screen
  // comes back from the router's cache unrendered, so the server's half
  // is stale — the device's half is what answers.
  it("goes out once this device has been shown the running version", () => {
    expect(showsUnreadDot(true, "2.0.0", "2.0.0")).toBe(false);
  });

  it("stays lit when this device has seen nothing", () => {
    expect(showsUnreadDot(true, null, "2.0.0")).toBe(true);
  });

  it("stays lit when this device has only seen an older version", () => {
    expect(showsUnreadDot(true, "1.9.9", "2.0.0")).toBe(true);
  });

  // The device record can only ever take the dot away. Somebody who read
  // the release on another phone must not have one lit here, and nothing
  // this device remembers may create one.
  it("never lights a dot the server says is not there", () => {
    expect(showsUnreadDot(false, null, "2.0.0")).toBe(false);
    expect(showsUnreadDot(false, "1.0.0", "2.0.0")).toBe(false);
    expect(showsUnreadDot(false, "2.0.0", "2.0.0")).toBe(false);
  });

  // A rolled-back deployment leaves a record from the future. It means
  // "already read", not "unread", and this is the comparison — not string
  // equality — that gets it right.
  it("treats a record from the future as read", () => {
    expect(showsUnreadDot(true, "2.1.0", "2.0.0")).toBe(false);
  });

  // Blocked or cleared storage reads as null, and a value written by
  // something else is not guessed at. Either way the dot falls back to
  // what the server said, which is the behaviour the app had before the
  // device record existed.
  it("falls back to the server when the device record is unusable", () => {
    expect(showsUnreadDot(true, "not-a-version", "2.0.0")).toBe(true);
    expect(showsUnreadDot(true, "", "2.0.0")).toBe(true);
  });
});
