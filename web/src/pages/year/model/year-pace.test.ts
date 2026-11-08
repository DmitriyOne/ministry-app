import { describe, expect, it, vi } from "vitest";

// The entity barrels reach @/shared/config for the route prefixes, and
// that barrel builds env.ts, which fails outside a configured
// environment — stubbed as everywhere else that crosses a barrel.
vi.mock("@/shared/config", () => ({
  routes: { day: "/day", month: "/month", year: "/year" },
}));

import { parseDayKey } from "@/entities/ministry-day";
import { parseMonthKey } from "@/entities/ministry-status";

import { yearPace } from "./year-pace";

const day = (value: string) => {
  const key = parseDayKey(value);

  if (key === null) throw new Error(`not a day key: ${value}`);

  return key;
};

const month = (value: string) => {
  const key = parseMonthKey(value);

  if (key === null) throw new Error(`not a month key: ${value}`);

  return key;
};

// The twelve months of 2026/27 with the same goal in each, which is a
// regular pioneer who never changed status.
const pioneerYear = (goalHours: number | null = 50) =>
  [
    "2026-09-01",
    "2026-10-01",
    "2026-11-01",
    "2026-12-01",
    "2027-01-01",
    "2027-02-01",
    "2027-03-01",
    "2027-04-01",
    "2027-05-01",
    "2027-06-01",
    "2027-07-01",
    "2027-08-01",
  ].map((value) => ({ month: month(value), goalHours }));

describe("yearPace", () => {
  // The worked example from ADR 0067: two finished months at 50 h each
  // plus five days of a thirty-day November, against 75:15 served.
  it("asks for the finished months plus the share of this one", () => {
    const pace = yearPace({
      today: day("2026-11-05"),
      servedMinutes: 4515,
      goalHours: 600,
      months: pioneerYear(),
    });

    // 50 h + 50 h + 50 h × 5/30 = 6500 minutes.
    expect(pace?.neededMinutes).toBe(6500);
    expect(pace?.standing).toEqual({ kind: "behind", minutes: 1985 });
  });

  it("counts today as a whole day, like the month's pace does", () => {
    const first = yearPace({
      today: day("2026-09-01"),
      servedMinutes: 0,
      goalHours: 600,
      months: pioneerYear(),
    });

    // The first day of the year already asks for a thirtieth of
    // September, not for nothing.
    expect(first?.neededMinutes).toBe(100);
  });

  it("asks for every finished month on the last day of the year", () => {
    const pace = yearPace({
      today: day("2027-08-31"),
      servedMinutes: 36000,
      goalHours: 600,
      months: pioneerYear(),
    });

    expect(pace?.neededMinutes).toBe(36000);
    expect(pace?.standing).toEqual({ kind: "level" });
  });

  it("says ahead with a positive figure, the sign living in the words", () => {
    const pace = yearPace({
      today: day("2026-10-15"),
      servedMinutes: 6000,
      goalHours: 600,
      months: pioneerYear(),
    });

    // 50 h + 50 h × 15/31 = 4452 minutes.
    expect(pace?.neededMinutes).toBe(4452);
    expect(pace?.standing).toEqual({ kind: "ahead", minutes: 1548 });
  });

  // The reason the year's needed figure is a sum and not a division.
  it("measures a pioneer appointed in October against October onwards", () => {
    const months = pioneerYear().map((entry, index) => (
      index === 0 ? { ...entry, goalHours: null } : entry
    ));

    const pace = yearPace({
      today: day("2026-11-05"),
      servedMinutes: 0,
      goalHours: 550,
      months,
    });

    // September asks for nothing at all, so by 5 November the year has
    // asked for October plus a sixth of November — not for two and a
    // bit months of a flat 600.
    expect(pace?.neededMinutes).toBe(3500);
  });

  describe("the rest of the year", () => {
    it("is per month, over the months left including this one", () => {
      const pace = yearPace({
        today: day("2026-11-05"),
        servedMinutes: 4515,
        goalHours: 600,
        months: pioneerYear(),
      });

      // 36000 − 4515 = 31485 over November through August, which is ten
      // months: 3148.5, rounded up so the rate actually reaches the goal.
      expect(pace?.rest).toEqual({ perMonthMinutes: 3149, months: 10 });
    });

    it("rounds up rather than down", () => {
      const pace = yearPace({
        today: day("2027-08-01"),
        servedMinutes: 35999,
        goalHours: 600,
        months: pioneerYear(),
      });

      expect(pace?.rest).toEqual({ perMonthMinutes: 1, months: 1 });
    });

    it("is gone once the goal is reached", () => {
      const pace = yearPace({
        today: day("2027-03-10"),
        servedMinutes: 36000,
        goalHours: 600,
        months: pioneerYear(),
      });

      expect(pace?.rest).toBeNull();
    });

    it("is gone when the goal is passed", () => {
      const pace = yearPace({
        today: day("2027-03-10"),
        servedMinutes: 40000,
        goalHours: 600,
        months: pioneerYear(),
      });

      expect(pace?.rest).toBeNull();
    });
  });

  describe("says nothing at all", () => {
    it("without a goal for the year", () => {
      expect(yearPace({
        today: day("2026-11-05"),
        servedMinutes: 4515,
        goalHours: null,
        months: pioneerYear(),
      })).toBeNull();
    });

    it("on a goal of zero, which SQL's coalesce can produce", () => {
      expect(yearPace({
        today: day("2026-11-05"),
        servedMinutes: 4515,
        goalHours: 0,
        months: pioneerYear(),
      })).toBeNull();
    });

    it("when the person's calendar did not read", () => {
      expect(yearPace({
        today: null,
        servedMinutes: 4515,
        goalHours: 600,
        months: pioneerYear(),
      })).toBeNull();
    });

    it("when the per-month goals did not read", () => {
      expect(yearPace({
        today: day("2026-11-05"),
        servedMinutes: 4515,
        goalHours: 600,
        months: null,
      })).toBeNull();
    });

    // A year that is over has no pace left: its difference against the
    // goal IS its result.
    it("on a year the person is no longer in", () => {
      expect(yearPace({
        today: day("2027-09-01"),
        servedMinutes: 4515,
        goalHours: 600,
        months: pioneerYear(),
      })).toBeNull();
    });

    it("on a year the person is not yet in", () => {
      expect(yearPace({
        today: day("2026-08-31"),
        servedMinutes: 0,
        goalHours: 600,
        months: pioneerYear(),
      })).toBeNull();
    });
  });
});
