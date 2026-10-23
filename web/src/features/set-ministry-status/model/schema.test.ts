import { describe, expect, it } from "vitest";

import { isValidGoalHours, parseGoalHours } from "./schema";

// The one number a person types in this app, so the shapes a text field
// can hand over are pinned rather than assumed. Number() alone would
// accept every one of the bad cases below: "" is 0, " 12 " is 12,
// "12.5" is 12.5 and "1e3" is 1000.
describe("parseGoalHours", () => {
  it("reads a whole number of hours", () => {
    expect(parseGoalHours("12")).toBe(12);
    expect(parseGoalHours(" 12 ")).toBe(12);
  });

  // Null, not zero: "no goal at all" is an answer a publisher may give,
  // and a goal of zero hours would be a different claim.
  it("reads an empty field as no goal", () => {
    expect(parseGoalHours("")).toBeNull();
    expect(parseGoalHours("   ")).toBeNull();
  });

  it("refuses anything that is not whole digits", () => {
    expect(parseGoalHours("12.5")).toBeNaN();
    expect(parseGoalHours("1e3")).toBeNaN();
    expect(parseGoalHours("-4")).toBeNaN();
    expect(parseGoalHours("twelve")).toBeNaN();
  });
});

describe("isValidGoalHours", () => {
  it("accepts no goal", () => {
    expect(isValidGoalHours("")).toBe(true);
  });

  it("accepts the whole range a month can hold", () => {
    expect(isValidGoalHours("1")).toBe(true);
    expect(isValidGoalHours("744")).toBe(true);
  });

  // 744 is 31 × 24, the ceiling the database carries as a check
  // constraint; zero would mean "a goal of nothing", which is what an
  // empty field already says.
  it("refuses both ends", () => {
    expect(isValidGoalHours("0")).toBe(false);
    expect(isValidGoalHours("745")).toBe(false);
  });

  it("refuses what is not a whole number", () => {
    expect(isValidGoalHours("12.5")).toBe(false);
  });
});
