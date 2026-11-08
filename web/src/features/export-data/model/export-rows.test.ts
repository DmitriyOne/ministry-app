import { describe, expect, it, vi } from "vitest";

// The entity barrels reach @/shared/config, whose env.ts throws in
// vitest. Only the paths are needed from it, and none of them by this
// module — the mock exists to keep the import graph quiet.
vi.mock("@/shared/config", () => ({
  routes: { day: "/day", month: "/month", year: "/year", calendar: "/calendar" },
}));

import { buildExportDayRows, buildExportMonthRows } from "./export-rows";

describe("buildExportDayRows", () => {
  it("carries the minutes through untouched beside a clock reading", () => {
    const [row] = buildExportDayRows([{ day: "2026-11-06", minutes: 125 }]);

    expect(row?.minutes).toBe(125);
    expect(row?.hours).toBe("2:05");
  });

  it("names the weekday, which the database does not store", () => {
    // 2026-11-06 is a Friday.
    expect(buildExportDayRows([{ day: "2026-11-06", minutes: 60 }])[0]?.weekday).toBe("Friday");
  });

  it("writes the month as a spreadsheet can group by it", () => {
    expect(buildExportDayRows([{ day: "2026-11-06", minutes: 60 }])[0]?.month).toBe("2026-11");
  });

  // September is this project's one calendar boundary, and the export has
  // to agree with every screen about which side of it a month is on.
  it("puts a month from September onwards in the year that starts there", () => {
    expect(buildExportDayRows([{ day: "2026-09-01", minutes: 60 }])[0]?.serviceYear)
      .toBe("2026 / 2027");
  });

  it("puts a month before September in the year before it", () => {
    expect(buildExportDayRows([{ day: "2026-08-31", minutes: 60 }])[0]?.serviceYear)
      .toBe("2025 / 2026");
  });

  // An export is a file somebody keeps; a line reading "2026-06-31" in it
  // would outlive any explanation.
  it("drops a row whose day is not a real date", () => {
    expect(buildExportDayRows([
      { day: "2026-06-31", minutes: 60 },
      { day: "nonsense", minutes: 60 },
      { day: "2026-06-30", minutes: 60 },
    ])).toHaveLength(1);
  });

  it("sorts ascending, whatever order the rows arrived in", () => {
    expect(buildExportDayRows([
      { day: "2026-11-06", minutes: 60 },
      { day: "2026-10-01", minutes: 60 },
      { day: "2026-11-01", minutes: 60 },
    ]).map((row) => row.day)).toEqual(["2026-10-01", "2026-11-01", "2026-11-06"]);
  });

  it("keeps a recorded zero, which is not the same as an empty day", () => {
    const [row] = buildExportDayRows([{ day: "2026-11-06", minutes: 0 }]);

    expect(row?.minutes).toBe(0);
    expect(row?.hours).toBe("0:00");
  });

  it("answers with nothing when nothing was recorded", () => {
    expect(buildExportDayRows([])).toEqual([]);
  });
});

describe("buildExportMonthRows", () => {
  const days = buildExportDayRows([
    { day: "2026-10-30", minutes: 90 },
    { day: "2026-11-01", minutes: 60 },
    { day: "2026-11-02", minutes: 0 },
    { day: "2026-11-03", minutes: 125 },
  ]);

  it("sums each month's minutes", () => {
    expect(buildExportMonthRows(days).map((month) => [month.month, month.minutes]))
      .toEqual([["2026-10", 90], ["2026-11", 185]]);
  });

  it("counts a recorded zero as a day recorded", () => {
    expect(buildExportMonthRows(days).find((month) => month.month === "2026-11")?.daysRecorded)
      .toBe(3);
  });

  it("formats the month total as a clock reading too", () => {
    expect(buildExportMonthRows(days).find((month) => month.month === "2026-11")?.hours)
      .toBe("3:05");
  });

  it("answers with nothing for no days", () => {
    expect(buildExportMonthRows([])).toEqual([]);
  });
});
