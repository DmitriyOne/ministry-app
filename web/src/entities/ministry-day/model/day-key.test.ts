import { describe, expect, it } from "vitest";

import { addDays, currentDayKey, parseDayKey, toDayKey } from "./day-key";

describe("parseDayKey", () => {
  it("accepts an ISO date", () => {
    expect(parseDayKey("2026-06-02")).toBe("2026-06-02");
  });

  it("refuses the shapes that look close enough to be dangerous", () => {
    expect(parseDayKey("2026-6-2")).toBeNull();
    expect(parseDayKey("2026-06")).toBeNull();
    expect(parseDayKey("2026-13-01")).toBeNull();
    expect(parseDayKey("2026-06-02T10:00:00Z")).toBeNull();
    expect(parseDayKey("")).toBeNull();
  });

  // The shape is right, so only the calendar can refuse these — which is
  // what the round trip through Date.UTC is for.
  it("refuses a day that does not exist in that month", () => {
    expect(parseDayKey("2026-02-30")).toBeNull();
    expect(parseDayKey("2026-04-31")).toBeNull();
    expect(parseDayKey("2027-02-29")).toBeNull();
  });

  it("accepts a leap day in a leap year", () => {
    expect(parseDayKey("2028-02-29")).toBe("2028-02-29");
  });
});

describe("toDayKey", () => {
  it("pads the parts", () => {
    expect(toDayKey(2026, 6, 2)).toBe("2026-06-02");
  });
});

describe("addDays", () => {
  const day = toDayKey(2026, 6, 2);

  it("moves within a month", () => {
    expect(addDays(day, 1)).toBe("2026-06-03");
    expect(addDays(day, -1)).toBe("2026-06-01");
  });

  it("rolls over a month end in both directions", () => {
    expect(addDays(toDayKey(2026, 6, 30), 1)).toBe("2026-07-01");
    expect(addDays(toDayKey(2026, 6, 1), -1)).toBe("2026-05-31");
  });

  it("rolls over a year end", () => {
    expect(addDays(toDayKey(2026, 12, 31), 1)).toBe("2027-01-01");
    expect(addDays(toDayKey(2026, 1, 1), -1)).toBe("2025-12-31");
  });

  it("counts the leap day", () => {
    expect(addDays(toDayKey(2028, 2, 28), 1)).toBe("2028-02-29");
    expect(addDays(toDayKey(2027, 2, 28), 1)).toBe("2027-03-01");
  });

  // What the seven-day strip asks for.
  it("steps back a week", () => {
    expect(addDays(day, -6)).toBe("2026-05-27");
  });

  // Not a date with a time in it: if the arithmetic ran in local time, a
  // clock change would make this answer 2026-03-28 or 2026-03-30.
  it("crosses a daylight-saving change cleanly", () => {
    expect(addDays(toDayKey(2026, 3, 28), 1)).toBe("2026-03-29");
    expect(addDays(toDayKey(2026, 10, 24), 1)).toBe("2026-10-25");
  });
});

describe("currentDayKey", () => {
  // 23:00 UTC: the hour when the Earth holds two dates at once, which is
  // the whole reason the zone is stored on the profile.
  const lastEveningOfOctober = new Date("2026-10-31T23:00:00Z");

  it("is still 31 October in London", () => {
    expect(currentDayKey("Europe/London", lastEveningOfOctober)).toBe("2026-10-31");
  });

  it("is already 1 November fourteen hours ahead", () => {
    expect(currentDayKey("Pacific/Kiritimati", lastEveningOfOctober)).toBe("2026-11-01");
  });

  it("is still 31 October eleven hours behind", () => {
    expect(currentDayKey("Pacific/Midway", lastEveningOfOctober)).toBe("2026-10-31");
  });

  it("uses the default zone when the profile has none", () => {
    expect(currentDayKey(null, lastEveningOfOctober)).toBe("2026-10-31");
  });
});
