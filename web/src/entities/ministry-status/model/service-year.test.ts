import { describe, expect, it } from "vitest";

import { toMonthKey } from "./month-key";
import { serviceYearGoalFrom, serviceYearOf, serviceYearStartMonth } from "./service-year";

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

describe("serviceYearStartMonth", () => {
  // The month somebody backdates to when they say "since the service
  // year began". Both sides of the boundary again, because a January
  // that reached forward to the September ahead of it would backdate
  // into the future.
  it("sends January back to the September before it", () => {
    expect(serviceYearStartMonth(toMonthKey(2027, 1))).toBe(toMonthKey(2026, 9));
  });

  it("sends August back to the September eleven months behind it", () => {
    expect(serviceYearStartMonth(toMonthKey(2027, 8))).toBe(toMonthKey(2026, 9));
  });

  // September answers with itself, and the sheet uses exactly that to
  // decide there is nothing to ask: starting "from the service year" and
  // "from this month" are the same statement in September.
  it("answers with itself in September", () => {
    expect(serviceYearStartMonth(toMonthKey(2026, 9))).toBe(toMonthKey(2026, 9));
  });
});

describe("serviceYearGoalFrom", () => {
  // The number from the leaflet belongs to somebody who pioneers the
  // whole year, and to nobody else — which is the difference the
  // sub-question in the sheet is about.
  it("comes to 600 from September", () => {
    expect(serviceYearGoalFrom(toMonthKey(2026, 9))).toBe(600);
  });

  it("comes to 550 from October, one month short", () => {
    expect(serviceYearGoalFrom(toMonthKey(2026, 10))).toBe(550);
  });

  it("comes to 250 from April, five months short of the year's end", () => {
    expect(serviceYearGoalFrom(toMonthKey(2027, 4))).toBe(250);
  });

  it("comes to one month's worth from August, the last month of the year", () => {
    expect(serviceYearGoalFrom(toMonthKey(2027, 8))).toBe(50);
  });
});
