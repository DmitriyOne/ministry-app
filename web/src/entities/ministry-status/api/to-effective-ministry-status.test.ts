import { describe, expect, it } from "vitest";

import { DEFAULT_MINISTRY_STATUS } from "../model/resolve-status";
import { toEffectiveMinistryStatus } from "./to-effective-ministry-status";

const row = {
  status: "regular_pioneer",
  monthly_goal_hours: 50,
  month: "2026-11-01",
};

describe("toEffectiveMinistryStatus", () => {
  it("reads a row the database answered with", () => {
    expect(toEffectiveMinistryStatus({ data: row, error: null })).toEqual({
      status: "regular_pioneer",
      monthlyGoalHours: 50,
      source: "2026-11-01",
    });
  });

  // No row is an answer, not an absence of one: a person who has never
  // chosen anything is a publisher with no goal.
  it("reads no row as the publisher default", () => {
    expect(toEffectiveMinistryStatus({ data: null, error: null })).toEqual(
      DEFAULT_MINISTRY_STATUS,
    );
  });

  // The two cases where the screen must show nothing rather than guess.
  it("gives nothing when the read failed", () => {
    expect(toEffectiveMinistryStatus({ data: null, error: new Error("boom") })).toBeNull();
    expect(toEffectiveMinistryStatus({ data: row, error: new Error("boom") })).toBeNull();
  });

  it("gives nothing for a status this build does not know", () => {
    expect(
      toEffectiveMinistryStatus({ data: { ...row, status: "special_pioneer" }, error: null }),
    ).toBeNull();
  });

  it("leaves the source empty rather than inventing a month", () => {
    expect(toEffectiveMinistryStatus({ data: { ...row, month: "2026-11" }, error: null }))
      .toEqual({ status: "regular_pioneer", monthlyGoalHours: 50, source: null });
  });
});
