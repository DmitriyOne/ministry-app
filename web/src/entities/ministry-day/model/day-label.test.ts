import { describe, expect, it } from "vitest";

import type { DayKey } from "./day-key";
import { dayHeading, formatDayDate } from "./day-label";

const day = (value: string) => value as DayKey;

describe("dayHeading", () => {
  it("names the day the person is in", () => {
    expect(dayHeading(day("2026-06-02"), day("2026-06-02"))).toEqual({ kind: "today" });
  });

  it("names the one before it", () => {
    expect(dayHeading(day("2026-06-01"), day("2026-06-02"))).toEqual({ kind: "yesterday" });
  });

  // The words exist because a weekday does not answer "is this the day I
  // am in?" — and they have to survive the edges where "yesterday" is in
  // another month and another year.
  it("says yesterday across a month end", () => {
    expect(dayHeading(day("2026-05-31"), day("2026-06-01"))).toEqual({ kind: "yesterday" });
  });

  it("says yesterday across a year end", () => {
    expect(dayHeading(day("2025-12-31"), day("2026-01-01"))).toEqual({ kind: "yesterday" });
  });

  it("falls back to the weekday further back", () => {
    expect(dayHeading(day("2026-06-02"), day("2026-06-04")))
      .toEqual({ kind: "weekday", weekday: "Tuesday" });
  });

  // The formatter reads the key as UTC midnight. In the server's own
  // zone, west of UTC, the same key would print as the day before — and
  // the heading would name the wrong weekday for everybody.
  it("names the weekday of the key, not of the server's midnight", () => {
    expect(dayHeading(day("2026-06-01"), day("2026-06-04")))
      .toEqual({ kind: "weekday", weekday: "Monday" });
  });

  it("names the weekday of a leap day", () => {
    expect(dayHeading(day("2028-02-29"), day("2028-03-05")))
      .toEqual({ kind: "weekday", weekday: "Tuesday" });
  });
});

describe("formatDayDate", () => {
  it("leaves the year out within the year we are in", () => {
    expect(formatDayDate(day("2026-06-02"), day("2026-11-20"))).toBe("2 June");
  });

  // On a day eighteen months back the year is the whole point.
  it("spells the year out when it is another one", () => {
    expect(formatDayDate(day("2025-06-02"), day("2026-01-02"))).toBe("2 June 2025");
  });

  it("does not shift the date by a day", () => {
    expect(formatDayDate(day("2026-01-01"), day("2026-01-05"))).toBe("1 January");
    expect(formatDayDate(day("2026-12-31"), day("2026-01-05"))).toBe("31 December");
  });
});
