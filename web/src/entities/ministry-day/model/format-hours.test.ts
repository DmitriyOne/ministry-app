import { describe, expect, it } from "vitest";

import { formatHours, splitDuration } from "./format-hours";

describe("formatHours", () => {
  it("reads as a clock", () => {
    expect(formatHours(0)).toBe("0:00");
    expect(formatHours(5)).toBe("0:05");
    expect(formatHours(45)).toBe("0:45");
    expect(formatHours(60)).toBe("1:00");
    expect(formatHours(65)).toBe("1:05");
    expect(formatHours(24 * 60)).toBe("24:00");
  });

  it("pads minutes and not hours", () => {
    expect(formatHours(615)).toBe("10:15");
  });

  // A month's total, not a day's: the progress block prints the same way,
  // and three digits of hours must not start padding or wrapping.
  it("prints a total bigger than a day", () => {
    expect(formatHours(16_320)).toBe("272:00");
  });
});

describe("splitDuration", () => {
  it("splits into whole hours and the rest", () => {
    expect(splitDuration(1690)).toEqual({ hours: 28, minutes: 10 });
    expect(splitDuration(15)).toEqual({ hours: 0, minutes: 15 });
    expect(splitDuration(134 * 60)).toEqual({ hours: 134, minutes: 0 });
    expect(splitDuration(0)).toEqual({ hours: 0, minutes: 0 });
  });
});
