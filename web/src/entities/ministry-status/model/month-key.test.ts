import { describe, expect, it } from "vitest";

import { addMonths, monthOfYear, parseMonthKey, toMonthKey, yearOf } from "./month-key";

describe("toMonthKey", () => {
  it("pads the month so keys sort as strings", () => {
    expect(toMonthKey(2026, 9)).toBe("2026-09-01");
    expect(toMonthKey(2026, 10)).toBe("2026-10-01");
  });

  // Sorting is how every other function here finds "the latest row", so
  // it is asserted rather than assumed.
  it("orders months correctly as plain strings", () => {
    expect(toMonthKey(2026, 9) < toMonthKey(2026, 10)).toBe(true);
    expect(toMonthKey(2026, 12) < toMonthKey(2027, 1)).toBe(true);
  });
});

describe("parseMonthKey", () => {
  // The one gate between a string from outside and a MonthKey. Past it,
  // nothing checks the shape again, which is the point of the brand.
  it("accepts a first-of-month date", () => {
    expect(parseMonthKey("2026-10-01")).toBe("2026-10-01");
  });

  // The shapes that are close enough to be dangerous: a real date that
  // is not the first, and a month that does not exist.
  it("refuses a date that is not the first of a month", () => {
    expect(parseMonthKey("2026-10-15")).toBeNull();
  });

  it("refuses a month outside 1-12", () => {
    expect(parseMonthKey("2026-13-01")).toBeNull();
    expect(parseMonthKey("2026-00-01")).toBeNull();
  });

  it("refuses anything that is not a date at all", () => {
    expect(parseMonthKey("2026-10")).toBeNull();
    expect(parseMonthKey("")).toBeNull();
    expect(parseMonthKey("2026-10-01T00:00:00Z")).toBeNull();
  });
});

describe("monthOfYear and yearOf", () => {
  it("read the parts back out", () => {
    expect(yearOf(toMonthKey(2026, 9))).toBe(2026);
    expect(monthOfYear(toMonthKey(2026, 9))).toBe(9);
  });
});

describe("addMonths", () => {
  it("moves within a year", () => {
    expect(addMonths(toMonthKey(2026, 9), 2)).toBe("2026-11-01");
  });

  it("rolls the year over forwards", () => {
    expect(addMonths(toMonthKey(2026, 12), 1)).toBe("2027-01-01");
  });

  it("rolls the year over backwards", () => {
    expect(addMonths(toMonthKey(2026, 1), -1)).toBe("2025-12-01");
  });

  // Twelve months on is the same month a year later — the step a
  // service-year screen takes every time it walks past August.
  it("lands on the same month a year later", () => {
    expect(addMonths(toMonthKey(2026, 9), 12)).toBe("2027-09-01");
  });

  it("goes back a whole year as well", () => {
    expect(addMonths(toMonthKey(2026, 9), -12)).toBe("2025-09-01");
  });
});
