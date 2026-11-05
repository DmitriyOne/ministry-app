import { describe, expect, it } from "vitest";

import { toMonthKey } from "./month-key";
import { formatMonthName, monthHeading } from "./month-label";

describe("formatMonthName", () => {
  it("names the month", () => {
    expect(formatMonthName(toMonthKey(2026, 6))).toBe("June");
  });
});

describe("monthHeading", () => {
  it("names the month with its year", () => {
    expect(monthHeading(toMonthKey(2026, 6))).toBe("June 2026");
  });

  // January is the one that catches a formatter left in the server's
  // zone: anywhere west of UTC it would print the December before it.
  it("stays in UTC, so January does not slip into December", () => {
    expect(monthHeading(toMonthKey(2026, 1))).toBe("January 2026");
  });
});
