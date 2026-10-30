import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config", () => ({ routes: { day: "/day", month: "/month" } }));

import { formatClosedOn } from "./closed-on";

describe("formatClosedOn", () => {
  it("names the day in the person's own calendar", () => {
    expect(formatClosedOn("2026-07-01T09:00:00Z", "Europe/London")).toBe("1 July");
  });

  // The hour that separates the two answers: 22:00 UTC on 30 June is
  // already 1 July in Auckland, and the server's calendar would say the
  // month was closed a day earlier than the person did it.
  it("does not fall back to the server's calendar", () => {
    expect(formatClosedOn("2026-06-30T22:00:00Z", "Pacific/Auckland")).toBe("1 July");
  });

  it("falls back to the default zone when there is none", () => {
    expect(formatClosedOn("2026-07-01T09:00:00Z", null)).toBe("1 July");
  });

  // Not a thing the database can hand back — checked because the
  // alternative is "Invalid Date" in a sentence on somebody's phone.
  it("answers null for anything that is not a timestamp", () => {
    expect(formatClosedOn("not a date", null)).toBeNull();
  });
});
