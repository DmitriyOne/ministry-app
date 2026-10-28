import { describe, expect, it } from "vitest";

import { goalStanding } from "./goal-standing";

describe("goalStanding", () => {
  // The case the owner was looking at on 28 October: 1:50 served
  // against a goal of 30 hours. The figure must be the plain rest of the
  // goal — 28 h 10 min — and not a share of it worked out from the date,
  // which is what produced the unreadable "25 h 16 min" (ADR 0064,
  // decision 10).
  it("owes the rest of the goal", () => {
    expect(goalStanding(110, 30)).toEqual({ kind: "short", minutes: 1690 });
  });

  it("is level on the goal exactly", () => {
    expect(goalStanding(30 * 60, 30)).toEqual({ kind: "level" });
    expect(goalStanding(0, 0)).toEqual({ kind: "level" });
  });

  it("is ahead past the goal", () => {
    expect(goalStanding(31 * 60 + 30, 30)).toEqual({ kind: "ahead", minutes: 90 });
  });

  // The service year works the same way and with much bigger numbers:
  // 277:15 of 360 hours.
  it("owes the rest of a service year", () => {
    expect(goalStanding(277 * 60 + 15, 360)).toEqual({ kind: "short", minutes: 82 * 60 + 45 });
  });

  // The gap is always positive: the sign is in the words beside it, not
  // in the number, so nothing downstream has to negate anything.
  it("never answers with a negative size", () => {
    expect(goalStanding(0, 744)).toEqual({ kind: "short", minutes: 744 * 60 });
  });
});
