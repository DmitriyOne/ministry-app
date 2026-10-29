import { describe, expect, it } from "vitest";

import { DEFAULT_TIME_ZONE, resolveTimeZone, zonedDate } from "./time-zone";

describe("resolveTimeZone", () => {
  it("keeps a zone this runtime knows", () => {
    expect(resolveTimeZone("Europe/Moscow")).toBe("Europe/Moscow");
  });

  it("falls back when the column is empty", () => {
    expect(resolveTimeZone(null)).toBe(DEFAULT_TIME_ZONE);
    expect(resolveTimeZone("")).toBe(DEFAULT_TIME_ZONE);
  });

  // The database only checks the SHAPE of the string, so a well-formed
  // name for a zone that does not exist can reach us. Without the
  // fallback, formatting a date with it throws and takes the screen.
  it("falls back on a well-formed name that is not a real zone", () => {
    expect(resolveTimeZone("Europe/Atlantis")).toBe(DEFAULT_TIME_ZONE);
  });
});

describe("zonedDate", () => {
  // The only moment any of this is interesting: 23:00 UTC on the last
  // day of October. All three answers are right, which is the whole
  // reason the zone is stored on the profile at all.
  const lastEveningOfOctober = new Date("2026-10-31T23:00:00Z");

  it("is still 31 October in London", () => {
    expect(zonedDate("Europe/London", lastEveningOfOctober))
      .toEqual({ year: 2026, month: 10, day: 31 });
  });

  it("is already 1 November fourteen hours ahead", () => {
    expect(zonedDate("Pacific/Kiritimati", lastEveningOfOctober))
      .toEqual({ year: 2026, month: 11, day: 1 });
  });

  it("is still 31 October eleven hours behind", () => {
    expect(zonedDate("Pacific/Midway", lastEveningOfOctober))
      .toEqual({ year: 2026, month: 10, day: 31 });
  });

  it("uses the default zone when the profile has none", () => {
    expect(zonedDate(null, lastEveningOfOctober))
      .toEqual({ year: 2026, month: 10, day: 31 });
  });
});
