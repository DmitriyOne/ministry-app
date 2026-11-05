import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config", () => ({ routes: { day: "/day", month: "/month" } }));

import { buildMonthDays } from "./month-days";

describe("buildMonthDays", () => {
  it("has nothing to show for a month nobody recorded", () => {
    expect(buildMonthDays([])).toEqual([]);
  });

  it("orders the days and adds each one to the running total", () => {
    const rows = buildMonthDays([
      { day: "2026-06-04", minutes: 45 },
      { day: "2026-06-01", minutes: 75 },
      { day: "2026-06-02", minutes: 60 },
    ]);

    expect(rows.map((row) => row.day)).toEqual(["2026-06-01", "2026-06-02", "2026-06-04"]);
    expect(rows.map((row) => row.runningMinutes)).toEqual([75, 135, 180]);
  });

  // A recorded zero means somebody looked and there was nothing, which
  // is not the same as a day with no row at all (ADR 0062). It keeps its
  // line, and the running total goes flat across it.
  it("keeps a recorded zero as a day of its own", () => {
    const rows = buildMonthDays([
      { day: "2026-06-01", minutes: 75 },
      { day: "2026-06-02", minutes: 0 },
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ day: "2026-06-02", minutes: 0, runningMinutes: 75 });
  });

  // The rows come from the database, so a day that cannot be parsed is
  // not a thing that happens — but it reaches a screen as an address if
  // it ever did, and a 404 is better than a link to nowhere.
  it("drops a row whose day is not a day", () => {
    expect(buildMonthDays([{ day: "2026-06-31", minutes: 30 }])).toEqual([]);
  });
});
