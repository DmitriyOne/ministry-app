import { describe, expect, it } from "vitest";

import { toMinistryStatusRows } from "./to-ministry-status-rows";

const row = {
  month: "2026-10-01",
  status: "regular_pioneer",
  duration: "until_changed",
  monthly_goal_hours: 50,
};

describe("toMinistryStatusRows", () => {
  it("reads the rows the rules work on", () => {
    expect(toMinistryStatusRows({ data: [row], error: null })).toEqual([
      {
        month: "2026-10-01",
        status: "regular_pioneer",
        duration: "until_changed",
        monthlyGoalHours: 50,
      },
    ]);
  });

  // Not the same as a failed read: this person has never chosen, and the
  // rules answer "publisher, no goal" for every month of it.
  it("reads no rows as no history", () => {
    expect(toMinistryStatusRows({ data: [], error: null })).toEqual([]);
  });

  it("says nothing when the read failed", () => {
    expect(toMinistryStatusRows({ data: null, error: new Error("nope") })).toBeNull();
  });

  // A year missing one month would come back as a goal that is simply
  // wrong, and nothing on screen would admit it.
  it("refuses the whole answer when one row cannot be read", () => {
    expect(toMinistryStatusRows({
      data: [row, { ...row, status: "special_pioneer" }],
      error: null,
    })).toBeNull();
    expect(toMinistryStatusRows({
      data: [{ ...row, month: "2026-10-15" }],
      error: null,
    })).toBeNull();
    expect(toMinistryStatusRows({
      data: [{ ...row, duration: "forever" }],
      error: null,
    })).toBeNull();
  });
});
