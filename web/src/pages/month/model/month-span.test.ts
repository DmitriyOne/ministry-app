import { describe, expect, it, vi } from "vitest";

// The entity barrels reach @/shared/config for the route prefixes, and
// that barrel builds env.ts, which fails outside a configured
// environment — stubbed as everywhere else that crosses a barrel.
vi.mock("@/shared/config", () => ({ routes: { day: "/day", month: "/month" } }));

import { toMonthKey } from "@/entities/ministry-status";

import { canStepForward, monthSpan } from "./month-span";

describe("monthSpan", () => {
  it("runs from the first day to the last, both ends included", () => {
    expect(monthSpan(toMonthKey(2026, 6))).toEqual({
      from: "2026-06-01",
      to: "2026-06-30",
    });
  });

  // No table of month lengths and no leap-year rule in the code: the
  // last day is the day before the first of the next month.
  it("knows February without being told", () => {
    expect(monthSpan(toMonthKey(2026, 2)).to).toBe("2026-02-28");
    expect(monthSpan(toMonthKey(2028, 2)).to).toBe("2028-02-29");
  });

  it("rolls the year over in December", () => {
    expect(monthSpan(toMonthKey(2026, 12)).to).toBe("2026-12-31");
  });
});

describe("canStepForward", () => {
  it("steps forward from a month behind the current one", () => {
    expect(canStepForward(toMonthKey(2026, 5), toMonthKey(2026, 6))).toBe(true);
  });

  it("stops at the month the person is in", () => {
    expect(canStepForward(toMonthKey(2026, 6), toMonthKey(2026, 6))).toBe(false);
  });

  // The zone did not read, so "now" is unknown. Stepping forward on a
  // guess would hand somebody a 404 exactly when the database recovered.
  it("refuses to guess when the current month is unknown", () => {
    expect(canStepForward(toMonthKey(2026, 5), null)).toBe(false);
  });
});
