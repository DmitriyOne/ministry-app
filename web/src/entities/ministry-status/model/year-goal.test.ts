import { describe, expect, it } from "vitest";

import { visibleYearGoalHours } from "./year-goal";

describe("visibleYearGoalHours", () => {
  it("gives a regular pioneer the figure the database summed", () => {
    expect(visibleYearGoalHours("regular_pioneer", 600)).toBe(600);
  });

  // A year only partly pioneered keeps its own number rather than the
  // one from the leaflet (ADR 0061, decision 5).
  it("keeps a part-pioneered year as it was summed", () => {
    expect(visibleYearGoalHours("regular_pioneer", 500)).toBe(500);
  });

  // The case the owner found: September was pioneered, October was
  // taken as a one-month auxiliary pioneer, so the sum is still above
  // zero — but the person is not under a yearly norm any more.
  it("takes the figure away from somebody who is no longer a pioneer", () => {
    expect(visibleYearGoalHours("auxiliary_pioneer", 50)).toBeNull();
    expect(visibleYearGoalHours("publisher", 50)).toBeNull();
    expect(visibleYearGoalHours("regular_auxiliary_pioneer", 50)).toBeNull();
  });

  it("answers null when nothing was ever pioneered", () => {
    expect(visibleYearGoalHours("regular_pioneer", 0)).toBeNull();
    expect(visibleYearGoalHours("regular_pioneer", null)).toBeNull();
  });

  // The status itself can be missing: the read failed, or the database
  // holds one this build does not know (read-day-page reports that).
  it("answers null when the status is not known", () => {
    expect(visibleYearGoalHours(null, 600)).toBeNull();
    expect(visibleYearGoalHours(undefined, 600)).toBeNull();
  });
});
