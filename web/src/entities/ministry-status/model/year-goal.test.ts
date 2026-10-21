import { describe, expect, it } from "vitest";

import { toMonthKey } from "./month-key";
import type { MinistryStatusRow } from "./resolve-status";
import { serviceYearGoalHours } from "./year-goal";

const pioneerFrom = (year: number, month: number): MinistryStatusRow => ({
  month: toMonthKey(year, month),
  status: "regular_pioneer",
  duration: "until_changed",
  monthlyGoalHours: 50,
});

describe("serviceYearGoalHours", () => {
  // The number people know, and it comes out of the sum rather than
  // being stored anywhere: 12 × 50.
  it("is 600 for a full year as a regular pioneer", () => {
    expect(serviceYearGoalHours([pioneerFrom(2026, 9)], 2026)).toBe(600);
  });

  // The case that decided against storing 600 (ADR 0061): appointed in
  // November, the truth about that year is 500, and a stored 600 would
  // have shown this person behind from the first day to the last.
  it("is 500 for someone appointed in November", () => {
    expect(serviceYearGoalHours([pioneerFrom(2026, 11)], 2026)).toBe(500);
  });

  // Why the whole history is passed in and not only this year's rows: a
  // status taken two years ago and never changed is what every month of
  // this year reads from.
  it("is 600 when the status was taken in an earlier service year", () => {
    expect(serviceYearGoalHours([pioneerFrom(2024, 3)], 2026)).toBe(600);
  });

  it("is zero for a publisher with no goal", () => {
    expect(serviceYearGoalHours([], 2026)).toBe(0);
  });

  it("counts a publisher's own goal like any other", () => {
    const rows: MinistryStatusRow[] = [
      {
        month: toMonthKey(2026, 9),
        status: "publisher",
        duration: "until_changed",
        monthlyGoalHours: 10,
      },
    ];

    expect(serviceYearGoalHours(rows, 2026)).toBe(120);
  });

  // A one-month auxiliary adds its own month and nothing else, which is
  // the arithmetic proof that it does not carry forward.
  it("adds a one-month auxiliary to that month alone", () => {
    const rows: MinistryStatusRow[] = [
      {
        month: toMonthKey(2026, 10),
        status: "auxiliary_pioneer",
        duration: "single_month",
        monthlyGoalHours: 15,
      },
    ];

    expect(serviceYearGoalHours(rows, 2026)).toBe(15);
  });

  it("sums a year that changed in the middle", () => {
    const rows: MinistryStatusRow[] = [
      {
        month: toMonthKey(2026, 9),
        status: "regular_auxiliary_pioneer",
        duration: "until_changed",
        monthlyGoalHours: 30,
      },
      pioneerFrom(2027, 3),
    ];

    // Six months at 30 (September to February), six at 50.
    expect(serviceYearGoalHours(rows, 2026)).toBe(180 + 300);
  });

  it("does not count a status that starts after the year ends", () => {
    expect(serviceYearGoalHours([pioneerFrom(2027, 9)], 2026)).toBe(0);
  });
});
