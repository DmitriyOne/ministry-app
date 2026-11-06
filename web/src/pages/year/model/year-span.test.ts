import { describe, expect, it, vi } from "vitest";

// The entity barrels reach @/shared/config for the route prefixes, and
// that barrel builds env.ts, which fails outside a configured
// environment — stubbed as everywhere else that crosses a barrel.
vi.mock("@/shared/config", () => ({
  routes: { day: "/day", month: "/month", year: "/year" },
}));

import {
  canStepForward,
  isFutureYear,
  serviceYearMonths,
  serviceYearSpan,
} from "./year-span";

describe("serviceYearSpan", () => {
  it("runs from September the 1st to August the 31st", () => {
    expect(serviceYearSpan(2026)).toEqual({ from: "2026-09-01", to: "2027-08-31" });
  });

  // No table of month lengths and no leap-year rule in the file: the
  // last day is the day before the first of the month after the twelfth,
  // so this is a property of the arithmetic rather than of a constant.
  it("ends on the 31st across a leap year too", () => {
    expect(serviceYearSpan(2027)).toEqual({ from: "2027-09-01", to: "2028-08-31" });
  });

  it("contains the February of a leap year", () => {
    const span = serviceYearSpan(2027);

    expect(span.from <= "2028-02-29").toBe(true);
    expect(span.to >= "2028-02-29").toBe(true);
  });
});

describe("serviceYearMonths", () => {
  it("is twelve months, September first and August last", () => {
    const months = serviceYearMonths(2026);

    expect(months).toHaveLength(12);
    expect(months[0]).toBe("2026-09-01");
    expect(months[11]).toBe("2027-08-01");
  });

  it("crosses the calendar year in the middle, not at the ends", () => {
    const months = serviceYearMonths(2026);

    expect(months[3]).toBe("2026-12-01");
    expect(months[4]).toBe("2027-01-01");
  });

  it("is in order with no gaps and no repeats", () => {
    const months = serviceYearMonths(2026);

    expect(new Set(months).size).toBe(12);
    expect([...months].sort()).toEqual(months);
  });
});

describe("canStepForward", () => {
  it("is live on a year behind the one being lived", () => {
    expect(canStepForward(2025, 2026)).toBe(true);
  });

  it("is dead on the year being lived", () => {
    expect(canStepForward(2026, 2026)).toBe(false);
  });

  it("is dead on a year ahead of it", () => {
    expect(canStepForward(2027, 2026)).toBe(false);
  });

  // The zone did not read, so we do not know which year it is now.
  // Stepping forward on a guess would hand somebody a 404 exactly at the
  // moment the database answered again.
  it("is dead when the current year is unknown", () => {
    expect(canStepForward(2025, null)).toBe(false);
  });
});

describe("isFutureYear", () => {
  it("is true for a year that has not started", () => {
    expect(isFutureYear(2027, 2026)).toBe(true);
  });

  it("is false for the year being lived", () => {
    expect(isFutureYear(2026, 2026)).toBe(false);
  });

  it("is false for a year gone by", () => {
    expect(isFutureYear(2020, 2026)).toBe(false);
  });

  // Refusing nothing is the point: the screen turns this into a 404, and
  // a 404 on a guess is worse than a screen of dashes.
  it("is false when the current year is unknown", () => {
    expect(isFutureYear(2030, null)).toBe(false);
  });
});
