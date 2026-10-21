import { describe, expect, it } from "vitest";

import { toMonthKey } from "./month-key";
import {
  DEFAULT_MINISTRY_STATUS,
  type MinistryStatusRow,
  resolveStatusForMonth,
} from "./resolve-status";

// The owner's own example: publisher from September, a one-month
// auxiliary on 15 in October, a regular auxiliary on 30 from November.
const september: MinistryStatusRow = {
  month: toMonthKey(2026, 9),
  status: "publisher",
  duration: "until_changed",
  monthlyGoalHours: null,
};

const october: MinistryStatusRow = {
  month: toMonthKey(2026, 10),
  status: "auxiliary_pioneer",
  duration: "single_month",
  monthlyGoalHours: 15,
};

const november: MinistryStatusRow = {
  month: toMonthKey(2026, 11),
  status: "regular_auxiliary_pioneer",
  duration: "until_changed",
  monthlyGoalHours: 30,
};

const rows = [september, october, november];

describe("resolveStatusForMonth", () => {
  it("is the publisher default for someone who never chose anything", () => {
    expect(resolveStatusForMonth([], toMonthKey(2026, 10))).toEqual(DEFAULT_MINISTRY_STATUS);
  });

  it("is the default for a month before the first row", () => {
    expect(resolveStatusForMonth(rows, toMonthKey(2026, 8))).toEqual(DEFAULT_MINISTRY_STATUS);
  });

  it("reads a month that has a row of its own", () => {
    expect(resolveStatusForMonth(rows, toMonthKey(2026, 10))).toEqual({
      status: "auxiliary_pioneer",
      monthlyGoalHours: 15,
      source: "2026-10-01",
    });
  });

  it("carries a running status forward", () => {
    expect(resolveStatusForMonth(rows, toMonthKey(2027, 2))).toEqual({
      status: "regular_auxiliary_pioneer",
      monthlyGoalHours: 30,
      source: "2026-11-01",
    });
  });

  // The rule that lets a one-month status exist without a second row to
  // close it: November reads from September, stepping over the October
  // row that sits between them.
  it("steps over a one-month status when reading a later month", () => {
    expect(resolveStatusForMonth([september, october], toMonthKey(2026, 11))).toEqual({
      status: "publisher",
      monthlyGoalHours: null,
      source: "2026-09-01",
    });
  });

  // Carrying forward is not tied to the service year: nothing special
  // happens on 1 September, which is why the database needs no job to
  // generate rows for a new year.
  it("carries across the turn of the service year", () => {
    expect(resolveStatusForMonth(rows, toMonthKey(2027, 9)).source).toBe("2026-11-01");
  });

  it("ignores rows for months after the one asked about", () => {
    expect(resolveStatusForMonth(rows, toMonthKey(2026, 9)).source).toBe("2026-09-01");
  });

  // A screen fetches a whole year in one query and the order it gets
  // back is the database's business, not ours.
  it("does not care what order the rows arrive in", () => {
    expect(resolveStatusForMonth([november, september, october], toMonthKey(2026, 12)).source)
      .toBe("2026-11-01");
  });
});
