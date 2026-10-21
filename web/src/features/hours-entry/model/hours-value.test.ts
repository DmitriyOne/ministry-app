import { describe, expect, it } from "vitest";

import {
  addMinutes,
  formatHours,
  HOURS_QUICK_ADD_MINUTES,
  HOURS_STEP_MINUTES,
  MAX_DAY_MINUTES,
  wouldChange,
} from "./hours-value";

describe("addMinutes", () => {
  it("adds the step", () => {
    expect(addMinutes(0, HOURS_STEP_MINUTES)).toBe(5);
    expect(addMinutes(55, HOURS_STEP_MINUTES)).toBe(60);
  });

  it("takes the step away", () => {
    expect(addMinutes(60, -HOURS_STEP_MINUTES)).toBe(55);
  });

  it("stops at zero instead of going negative", () => {
    expect(addMinutes(0, -HOURS_STEP_MINUTES)).toBe(0);
    expect(addMinutes(5, -15)).toBe(0);
  });

  it("stops at the end of the day", () => {
    expect(addMinutes(MAX_DAY_MINUTES, HOURS_STEP_MINUTES)).toBe(MAX_DAY_MINUTES);
    // 23:50 plus the biggest quick-add lands on the cap, not short of it.
    expect(addMinutes(MAX_DAY_MINUTES - 10, 45)).toBe(MAX_DAY_MINUTES);
  });

  it("holds every quick-add on an empty day", () => {
    expect(HOURS_QUICK_ADD_MINUTES.map((delta) => addMinutes(0, delta))).toEqual([15, 30, 45]);
  });
});

describe("formatHours", () => {
  it("reads as a clock", () => {
    expect(formatHours(0)).toBe("0:00");
    expect(formatHours(5)).toBe("0:05");
    expect(formatHours(45)).toBe("0:45");
    expect(formatHours(60)).toBe("1:00");
    expect(formatHours(65)).toBe("1:05");
    expect(formatHours(MAX_DAY_MINUTES)).toBe("24:00");
  });

  it("pads minutes and not hours", () => {
    expect(formatHours(615)).toBe("10:15");
  });
});

describe("wouldChange", () => {
  it("is false where the tap would do nothing", () => {
    expect(wouldChange(0, -HOURS_STEP_MINUTES)).toBe(false);
    expect(wouldChange(MAX_DAY_MINUTES, HOURS_STEP_MINUTES)).toBe(false);
    expect(wouldChange(MAX_DAY_MINUTES, 45)).toBe(false);
  });

  it("is true everywhere in between, and at the edge it can still reach", () => {
    expect(wouldChange(0, HOURS_STEP_MINUTES)).toBe(true);
    expect(wouldChange(MAX_DAY_MINUTES, -HOURS_STEP_MINUTES)).toBe(true);
    // Not at the cap yet: clamping still moves the number, so the button
    // stays live rather than refusing a tap that has somewhere to go.
    expect(wouldChange(MAX_DAY_MINUTES - 5, 45)).toBe(true);
  });
});
