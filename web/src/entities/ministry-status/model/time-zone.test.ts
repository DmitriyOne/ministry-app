import { describe, expect, it } from "vitest";

import { currentMonthKey } from "./time-zone";

describe("currentMonthKey", () => {
  // The only moment this function is interesting: 23:00 UTC on the last
  // day of October. Both answers are right, which is the whole reason
  // the zone is stored on the profile at all. How a date is read in a
  // zone is tested where it lives, in shared/lib/time-zone; what is
  // tested here is that a month key comes out of it.
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
