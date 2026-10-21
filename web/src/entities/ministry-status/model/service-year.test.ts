import { describe, expect, it } from "vitest";

import { toMonthKey } from "./month-key";
import { serviceYearMonths, serviceYearOf } from "./service-year";

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

describe("serviceYearMonths", () => {
  const months = serviceYearMonths(2026);

  it("is twelve months long", () => {
    expect(months).toHaveLength(12);
  });

  it("runs September to August", () => {
    expect(months[0]).toBe("2026-09-01");
    expect(months[11]).toBe("2027-08-01");
  });

  // The year's goal is summed over exactly this list, so a repeated or
  // missing month would be counted twice or not at all.
  it("has no repeats", () => {
    expect(new Set(months).size).toBe(12);
  });

  it("every month belongs to the year it was asked for", () => {
    expect(months.every((month) => serviceYearOf(month) === 2026)).toBe(true);
  });
});
