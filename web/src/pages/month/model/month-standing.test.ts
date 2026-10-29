import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config", () => ({ routes: { day: "/day", month: "/month" } }));

import { monthStanding } from "./month-standing";

describe("monthStanding", () => {
  it("counts what is still owed", () => {
    expect(monthStanding(135, 30)).toEqual({ kind: "short", minutes: 1665 });
  });

  // Exactly on the goal is met, not "nothing left": a "0 min to go"
  // under a full bar is a sentence nobody needs.
  it("calls the exact goal met", () => {
    expect(monthStanding(30 * 60, 30)).toEqual({ kind: "met" });
  });

  it("calls anything beyond the goal met too", () => {
    expect(monthStanding(31 * 60, 30)).toEqual({ kind: "met" });
  });
});
