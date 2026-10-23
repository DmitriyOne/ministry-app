import { describe, expect, it } from "vitest";

import { currentMonthKey, DEFAULT_TIME_ZONE, resolveTimeZone } from "./time-zone";

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

describe("currentMonthKey", () => {
  // The only moment this function is interesting: 23:00 UTC on the last
  // day of October. Both answers are right, which is the whole reason
  // the zone is stored on the profile at all.
  const lastEveningOfOctober = new Date("2026-10-31T23:00:00Z");

  it("is still October in London", () => {
    expect(currentMonthKey("Europe/London", lastEveningOfOctober)).toBe("2026-10-01");
  });

  it("is already November fourteen hours ahead", () => {
    expect(currentMonthKey("Pacific/Kiritimati", lastEveningOfOctober)).toBe("2026-11-01");
  });

  it("is still October eleven hours behind", () => {
    expect(currentMonthKey("Pacific/Midway", lastEveningOfOctober)).toBe("2026-10-01");
  });

  it("uses the default zone when the profile has none", () => {
    expect(currentMonthKey(null, lastEveningOfOctober)).toBe("2026-10-01");
  });

  it("reads a month in the middle of the month the same way", () => {
    expect(currentMonthKey("Europe/Moscow", new Date("2026-02-14T09:30:00Z"))).toBe("2026-02-01");
  });
});
