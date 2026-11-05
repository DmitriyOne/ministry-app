import { describe, expect, it, vi } from "vitest";

// The entity barrels reach @/shared/config for the route prefixes, and
// that barrel builds env.ts, which fails outside a configured
// environment — stubbed as everywhere else that crosses a barrel.
vi.mock("@/shared/config", () => ({ routes: { day: "/day", month: "/month" } }));

import { toMonthKey } from "@/entities/ministry-status";

import { canStepForward, isFutureMonth, monthSpan } from "./month-span";

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

// The mirror of the above, and the reason it has a name of its own: the
// screen answers 404 by it, and nothing else can catch it being turned
// around.
describe("isFutureMonth", () => {
  it("calls a month after the current one future", () => {
    expect(isFutureMonth(toMonthKey(2026, 7), toMonthKey(2026, 6))).toBe(true);
  });

  it("does not call the month the person is in future", () => {
    expect(isFutureMonth(toMonthKey(2026, 6), toMonthKey(2026, 6))).toBe(false);
  });

  it("does not call a month behind the current one future", () => {
    expect(isFutureMonth(toMonthKey(2026, 5), toMonthKey(2026, 6))).toBe(false);
  });

  it("crosses the year as the month count does, not the calendar year", () => {
    expect(isFutureMonth(toMonthKey(2027, 1), toMonthKey(2026, 12))).toBe(true);
    expect(isFutureMonth(toMonthKey(2026, 12), toMonthKey(2027, 1))).toBe(false);
  });

  // The zone did not read. Nothing is refused: the arrow already does
  // not offer the step, and answering 404 on a guess would hide a month
  // somebody is entitled to.
  it("refuses nothing when the current month is unknown", () => {
    expect(isFutureMonth(toMonthKey(2099, 1), null)).toBe(false);
  });
});
