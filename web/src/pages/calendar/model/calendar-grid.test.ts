import { describe, expect, it, vi } from "vitest";

// The entity barrels reach @/shared/config for the route prefixes, and
// that barrel builds env.ts, which fails outside a configured
// environment — stubbed as everywhere else that crosses a barrel.
vi.mock("@/shared/config", () => ({
  routes: { day: "/day", month: "/month", year: "/year", calendar: "/calendar" },
}));

import { parseDayKey } from "@/entities/ministry-day";
import { parseMonthKey } from "@/entities/ministry-status";

import {
  buildCalendarWeeks,
  calendarDays,
  DAYS_IN_WEEK,
  initialSelectedDay,
} from "./calendar-grid";

const month = (value: string) => {
  const key = parseMonthKey(value);

  if (key === null) throw new Error(`not a month key: ${value}`);

  return key;
};

const day = (value: string) => {
  const key = parseDayKey(value);

  if (key === null) throw new Error(`not a day key: ${value}`);

  return key;
};

// November 2026 begins on a Sunday and has 30 days; February 2028 is a
// leap February beginning on a Tuesday. Both are real calendars, not
// numbers chosen to make the test pass.
const november = month("2026-11-01");

describe("buildCalendarWeeks", () => {
  it("gives every week seven slots", () => {
    const weeks = buildCalendarWeeks(november, []);

    expect(weeks.every((week) => week.length === DAYS_IN_WEEK)).toBe(true);
  });

  it("leaves the days before the 1st blank", () => {
    const [first] = buildCalendarWeeks(november, []);

    // 1 November 2026 is a Sunday, so it is the last slot of the first
    // week and six come before it.
    expect(first?.slice(0, 6).every((slot) => slot === null)).toBe(true);
    expect(first?.at(-1)?.dayOfMonth).toBe(1);
  });

  it("holds every day of the month and no more", () => {
    const days = calendarDays(buildCalendarWeeks(november, []));

    expect(days).toHaveLength(30);
    expect(days.at(-1)?.day).toBe("2026-11-30");
  });

  it("counts a leap February to the 29th", () => {
    const days = calendarDays(buildCalendarWeeks(month("2028-02-01"), []));

    expect(days).toHaveLength(29);
  });

  it("pads the last week rather than letting the grid go ragged", () => {
    const weeks = buildCalendarWeeks(november, []);

    expect(weeks.at(-1)?.at(-1)).toBeNull();
  });

  // The distinction the dot rests on, and the one the database keeps by
  // leaving an empty day out of its answer entirely.
  it("tells a day nobody opened from a day holding a recorded zero", () => {
    const days = calendarDays(buildCalendarWeeks(november, [
      { day: "2026-11-02", minutes: 0 },
    ]));

    expect(days[0]?.minutes).toBeNull();
    expect(days[1]?.minutes).toBe(0);
  });

  it("puts the minutes on the day they belong to", () => {
    const days = calendarDays(buildCalendarWeeks(november, [
      { day: "2026-11-04", minutes: 445 },
    ]));

    expect(days[3]?.minutes).toBe(445);
    expect(days[2]?.minutes).toBeNull();
  });

  describe("the running total", () => {
    it("accumulates down the month", () => {
      const days = calendarDays(buildCalendarWeeks(november, [
        { day: "2026-11-02", minutes: 90 },
        { day: "2026-11-04", minutes: 445 },
      ]));

      expect(days.map((d) => d.runningMinutes).slice(0, 5))
        .toEqual([0, 90, 90, 535, 535]);
    });

    it("stands still across both an empty day and a recorded zero", () => {
      const days = calendarDays(buildCalendarWeeks(november, [
        { day: "2026-11-01", minutes: 60 },
        { day: "2026-11-03", minutes: 0 },
      ]));

      expect(days[1]?.runningMinutes).toBe(60);
      expect(days[2]?.runningMinutes).toBe(60);
    });

    it("is zero rather than null on an untouched month", () => {
      const days = calendarDays(buildCalendarWeeks(november, []));

      expect(days.every((d) => d.runningMinutes === 0)).toBe(true);
    });
  });

  describe("a shape the database should never send", () => {
    it("ignores an unparseable day", () => {
      const days = calendarDays(buildCalendarWeeks(november, [
        { day: "2026-11-31", minutes: 999 },
        { day: "not a day", minutes: 999 },
        { day: "2026-11-01", minutes: 60 },
      ]));

      expect(days[0]?.minutes).toBe(60);
      expect(days.at(-1)?.runningMinutes).toBe(60);
    });

    it("ignores a day from another month", () => {
      const days = calendarDays(buildCalendarWeeks(november, [
        { day: "2026-10-31", minutes: 999 },
      ]));

      expect(days.every((d) => d.minutes === null)).toBe(true);
    });
  });
});

describe("initialSelectedDay", () => {
  it("opens on today in the month being lived", () => {
    expect(initialSelectedDay(november, day("2026-11-06"))).toBe("2026-11-06");
  });

  it("selects nothing in a month that has no today in it", () => {
    expect(initialSelectedDay(month("2026-09-01"), day("2026-11-06"))).toBeNull();
  });

  // The zone did not read. Guessing a day would answer a question
  // nobody asked, and the card says "pick a day" instead.
  it("selects nothing when today is unknown", () => {
    expect(initialSelectedDay(november, null)).toBeNull();
  });
});
