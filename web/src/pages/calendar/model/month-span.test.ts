import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config", () => ({
  routes: { day: "/day", month: "/month", year: "/year", calendar: "/calendar" },
}));

import { parseMonthKey } from "@/entities/ministry-status";

import { canStepForward, isFutureMonth, monthSpan } from "./month-span";

const month = (value: string) => {
  const key = parseMonthKey(value);

  if (key === null) throw new Error(`not a month key: ${value}`);

  return key;
};

describe("monthSpan", () => {
  it("runs from the 1st to the last day", () => {
    expect(monthSpan(month("2026-11-01")))
      .toEqual({ from: "2026-11-01", to: "2026-11-30" });
  });

  it("ends a leap February on the 29th", () => {
    expect(monthSpan(month("2028-02-01")).to).toBe("2028-02-29");
  });

  it("rolls over the year", () => {
    expect(monthSpan(month("2026-12-01")))
      .toEqual({ from: "2026-12-01", to: "2026-12-31" });
  });
});

describe("canStepForward", () => {
  const current = month("2026-11-01");

  it("is true on a month behind the one being lived", () => {
    expect(canStepForward(month("2026-10-01"), current)).toBe(true);
  });

  it("is false on the month being lived", () => {
    expect(canStepForward(current, current)).toBe(false);
  });

  // The zone did not read. Offering the step would hand somebody a 404
  // at the moment the database answered again.
  it("is false when the current month is unknown", () => {
    expect(canStepForward(month("2026-10-01"), null)).toBe(false);
  });
});

describe("isFutureMonth", () => {
  const current = month("2026-11-01");

  it("is true for a month that has not started", () => {
    expect(isFutureMonth(month("2026-12-01"), current)).toBe(true);
  });

  it("is false for the month being lived and for a past one", () => {
    expect(isFutureMonth(current, current)).toBe(false);
    expect(isFutureMonth(month("2026-09-01"), current)).toBe(false);
  });

  // Unknown month refuses nothing: a 404 on a guess would hide a
  // calendar the person is entitled to see.
  it("is false when the current month is unknown", () => {
    expect(isFutureMonth(month("2027-12-01"), null)).toBe(false);
  });
});
