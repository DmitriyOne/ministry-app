import { describe, expect, it } from "vitest";

import { toMonthKey } from "./month-key";
import { serviceYearOf } from "./service-year";

describe("serviceYearOf", () => {
  // The boundary, from both sides. August belongs to the year that
  // started the previous September; September starts a new one.
  it("puts September in the year that starts with it", () => {
    expect(serviceYearOf(toMonthKey(2026, 9))).toBe(2026);
  });

  it("puts August in the year that started the September before", () => {
    expect(serviceYearOf(toMonthKey(2026, 8))).toBe(2025);
  });

  it("puts January in the year that started the September before", () => {
    expect(serviceYearOf(toMonthKey(2027, 1))).toBe(2026);
  });
});
