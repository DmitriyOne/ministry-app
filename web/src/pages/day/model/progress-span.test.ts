import { describe, expect, it, vi } from "vitest";

// The entity barrels below reach entities/ministry-day/model/day-path,
// which reads `routes` from `@/shared/config` — and that barrel also
// exports `env`, validated at import time, so the real one fails in the
// runner before a single assertion. Mocked rather than imported past the
// barrel: steiger forbids the sidestep (fsd/no-public-api-sidestep), and
// the runner is deliberately kept free of environment setup
// (vitest.config.mts: "minimal runner for pure functions"). Same note as
// features/network-status/api/check-connectivity.test.ts.
vi.mock("@/shared/config", () => ({ routes: { day: "/day" } }));

import { toDayKey } from "@/entities/ministry-day";
import { toMonthKey } from "@/entities/ministry-status";

import { monthOfDay, monthSpanOf, serviceYearSpanOf, serviceYearStartOf } from "./progress-span";

describe("monthOfDay", () => {
  it("is the first of the day's own month", () => {
    expect(monthOfDay(toDayKey(2026, 6, 15))).toBe("2026-06-01");
    expect(monthOfDay(toDayKey(2026, 1, 1))).toBe("2026-01-01");
    expect(monthOfDay(toDayKey(2026, 12, 31))).toBe("2026-12-01");
  });
});

describe("monthSpanOf", () => {
  it("runs from the first to the last day", () => {
    expect(monthSpanOf(toMonthKey(2026, 6))).toEqual({ from: "2026-06-01", to: "2026-06-30" });
    expect(monthSpanOf(toMonthKey(2026, 7))).toEqual({ from: "2026-07-01", to: "2026-07-31" });
  });

  // No month-length table and no leap rule in the code, so these two are
  // what prove the arithmetic rather than a comment claiming it.
  it("ends February where February ends", () => {
    expect(monthSpanOf(toMonthKey(2026, 2))).toEqual({ from: "2026-02-01", to: "2026-02-28" });
    expect(monthSpanOf(toMonthKey(2028, 2))).toEqual({ from: "2028-02-01", to: "2028-02-29" });
  });

  it("rolls the year over in December", () => {
    expect(monthSpanOf(toMonthKey(2026, 12))).toEqual({ from: "2026-12-01", to: "2026-12-31" });
  });
});

describe("serviceYearStartOf", () => {
  // September is the app's own boundary and the database knows nothing
  // about it (ADR 0061): a day in August belongs to the year that began
  // the previous September.
  it("is the September the year began in", () => {
    expect(serviceYearStartOf(toMonthKey(2026, 9))).toBe("2026-09-01");
    expect(serviceYearStartOf(toMonthKey(2026, 10))).toBe("2026-09-01");
    expect(serviceYearStartOf(toMonthKey(2027, 1))).toBe("2026-09-01");
    expect(serviceYearStartOf(toMonthKey(2027, 8))).toBe("2026-09-01");
  });
});

describe("serviceYearSpanOf", () => {
  it("runs September to the end of the following August", () => {
    expect(serviceYearSpanOf(toMonthKey(2026, 9))).toEqual({
      from: "2026-09-01",
      to: "2027-08-31",
    });
  });
});
