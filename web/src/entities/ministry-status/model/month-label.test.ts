import { describe, expect, it } from "vitest";

import { formatMonthName } from "./month-label";
import { toMonthKey } from "./month-key";

describe("formatMonthName", () => {
  it("names the month in full", () => {
    expect(formatMonthName(toMonthKey(2026, 6))).toBe("June");
    expect(formatMonthName(toMonthKey(2026, 9))).toBe("September");
  });

  // The guard against formatting in the server's zone: a January key
  // read as local midnight prints as December anywhere west of UTC.
  it("names January as January, whatever zone this runs in", () => {
    expect(formatMonthName(toMonthKey(2027, 1))).toBe("January");
  });
});
