import { describe, expect, it, vi } from "vitest";

// The entity barrels reach @/shared/config for the route prefixes, and
// that barrel builds env.ts, which fails outside a configured
// environment — stubbed as everywhere else that crosses a barrel.
vi.mock("@/shared/config", () => ({
  routes: { day: "/day", month: "/month", year: "/year" },
}));

import { parseMonthKey } from "@/entities/ministry-status";

import {
  buildYearMonths,
  hasAnyHours,
  isMonthShort,
  type YearMonthRow,
} from "./year-months";

const key = (value: string) => {
  const month = parseMonthKey(value);

  if (month === null) throw new Error(`not a month key: ${value}`);

  return month;
};
import { serviceYearMonths } from "./year-span";

const months = serviceYearMonths(2026);

const build = (
  parts: Partial<Parameters<typeof buildYearMonths>[0]> = {},
) => buildYearMonths({
  months,
  minutes: [],
  statuses: [],
  closedMonths: [],
  ...parts,
});

describe("buildYearMonths", () => {
  it("draws twelve lines whatever the readings held", () => {
    expect(build()).toHaveLength(12);
  });

  // The distinction the whole screen rests on, and the one the database
  // keeps by leaving an empty month out of its answer entirely.
  it("tells a month nobody opened from a month holding a recorded zero", () => {
    const rows = build({
      minutes: [{ month: "2026-10-01", minutes: 0 }],
    });

    expect(rows[0]?.minutes).toBeNull();
    expect(rows[1]?.minutes).toBe(0);
  });

  it("puts the minutes on the month they belong to", () => {
    const rows = build({
      minutes: [
        { month: "2026-09-01", minutes: 3130 },
        { month: "2027-01-01", minutes: 940 },
      ],
    });

    expect(rows[0]?.minutes).toBe(3130);
    expect(rows[4]?.minutes).toBe(940);
    expect(rows[1]?.minutes).toBeNull();
  });

  describe("the running total", () => {
    it("accumulates down the year", () => {
      const rows = build({
        minutes: [
          { month: "2026-09-01", minutes: 3130 },
          { month: "2026-10-01", minutes: 940 },
          { month: "2026-11-01", minutes: 445 },
        ],
      });

      expect(rows.map((row) => row.runningMinutes).slice(0, 4))
        .toEqual([3130, 4070, 4515, 4515]);
    });

    it("stands still across both an empty month and a recorded zero", () => {
      const rows = build({
        minutes: [
          { month: "2026-09-01", minutes: 600 },
          { month: "2026-11-01", minutes: 0 },
        ],
      });

      expect(rows[1]?.runningMinutes).toBe(600);
      expect(rows[2]?.runningMinutes).toBe(600);
    });

    // A year with nothing in it has run to zero, which is not the same
    // claim as "this month is empty" — so this one is a number, never
    // null.
    it("is zero rather than null on an untouched year", () => {
      expect(build().every((row) => row.runningMinutes === 0)).toBe(true);
    });
  });

  describe("the goals", () => {
    it("takes each month's own goal", () => {
      const rows = build({
        statuses: [
          { month: "2026-09-01", monthly_goal_hours: 50 },
          { month: "2026-10-01", monthly_goal_hours: 30 },
        ],
      });

      expect(rows[0]?.goalHours).toBe(50);
      expect(rows[1]?.goalHours).toBe(30);
    });

    it("reads a month with no status as having no goal", () => {
      expect(build().every((row) => row.goalHours === null)).toBe(true);
    });

    // Zero hours is "no goal", not a goal of nothing: a bar measured
    // against zero would be full the moment anybody served a minute.
    it("normalises a goal of zero to no goal", () => {
      const rows = build({
        statuses: [{ month: "2026-09-01", monthly_goal_hours: 0 }],
      });

      expect(rows[0]?.goalHours).toBeNull();
    });

    it("reads a null goal — a publisher's — as no goal", () => {
      const rows = build({
        statuses: [{ month: "2026-09-01", monthly_goal_hours: null }],
      });

      expect(rows[0]?.goalHours).toBeNull();
    });
  });

  describe("the closures", () => {
    it("marks the months that are closed and only those", () => {
      const rows = build({ closedMonths: ["2026-09-01", "2026-12-01"] });

      expect(rows.filter((row) => row.isClosed).map((row) => row.month))
        .toEqual(["2026-09-01", "2026-12-01"]);
    });

    it("marks nothing when nothing is closed", () => {
      expect(build().some((row) => row.isClosed)).toBe(false);
    });
  });

  // Every line is a link, and a link to /month/garbage is a 404 at the
  // other end — so a shape the parser refuses is dropped rather than
  // trusted, the way buildMonthDays drops an unparseable day.
  describe("a shape the database should never send", () => {
    it("ignores minutes against an unparseable month", () => {
      const rows = build({
        minutes: [
          { month: "2026-13-01", minutes: 999 },
          { month: "not a month", minutes: 999 },
          { month: "2026-09-01", minutes: 60 },
        ],
      });

      expect(rows[0]?.minutes).toBe(60);
      expect(rows.at(-1)?.runningMinutes).toBe(60);
    });

    it("ignores a goal and a closure against an unparseable month", () => {
      const rows = build({
        statuses: [{ month: "2026-00-01", monthly_goal_hours: 50 }],
        closedMonths: ["rubbish"],
      });

      expect(rows.every((row) => row.goalHours === null)).toBe(true);
      expect(rows.some((row) => row.isClosed)).toBe(false);
    });

    // A month outside this service year simply has no line to land on.
    it("ignores a month from another year", () => {
      const rows = build({
        minutes: [{ month: "2025-09-01", minutes: 999 }],
      });

      expect(rows.every((row) => row.minutes === null)).toBe(true);
    });
  });
});

describe("hasAnyHours", () => {
  it("is false on a year where nothing was recorded", () => {
    expect(hasAnyHours(build())).toBe(false);
  });

  // A recorded zero counts: somebody opened that month, so the table has
  // something to show rather than a sentence to say instead.
  it("is true on a year whose only entry is a recorded zero", () => {
    expect(hasAnyHours(build({
      minutes: [{ month: "2026-11-01", minutes: 0 }],
    }))).toBe(true);
  });

  it("is true once a month holds hours", () => {
    expect(hasAnyHours(build({
      minutes: [{ month: "2026-09-01", minutes: 60 }],
    }))).toBe(true);
  });
});

describe("isMonthShort", () => {
  const row = (
    month: string,
    minutes: number | null,
    goalHours: number | null,
  ): YearMonthRow => ({
    month: key(month),
    minutes,
    goalHours,
    isClosed: false,
    runningMinutes: 0,
  });

  const november = key("2026-11-01");

  it("is true for a finished month below its goal", () => {
    expect(isMonthShort(row("2026-10-01", 940, 50), november)).toBe(true);
  });

  it("is false for a finished month that met its goal", () => {
    expect(isMonthShort(row("2026-09-01", 3000, 50), november)).toBe(false);
  });

  it("is false for a finished month that passed its goal", () => {
    expect(isMonthShort(row("2026-09-01", 3130, 50), november)).toBe(false);
  });

  // The defect this function exists for: on the 5th of November, 7:25 of
  // 50 h is below the goal and is NOT a miss — there are twenty-five
  // days left in it.
  it("is false for the month being lived, however far below the goal", () => {
    expect(isMonthShort(row("2026-11-01", 445, 50), november)).toBe(false);
  });

  it("is false for a month that has not started", () => {
    expect(isMonthShort(row("2027-03-01", null, 50), november)).toBe(false);
  });

  it("is false for a month with no goal to fall short of", () => {
    expect(isMonthShort(row("2026-10-01", 60, null), november)).toBe(false);
  });

  it("is false for a month with nothing recorded, which is an absence", () => {
    expect(isMonthShort(row("2026-10-01", null, 50), november)).toBe(false);
  });

  // A recorded zero in a finished month IS a miss: somebody looked and
  // there was nothing, and the month is over.
  it("is true for a finished month holding a recorded zero", () => {
    expect(isMonthShort(row("2026-10-01", 0, 50), november)).toBe(true);
  });

  // The zone did not read. A guess would be wrong by a month for anybody
  // near a boundary, and silence costs only a colour.
  it("calls nothing a miss when the current month is unknown", () => {
    expect(isMonthShort(row("2026-10-01", 940, 50), null)).toBe(false);
  });
});
