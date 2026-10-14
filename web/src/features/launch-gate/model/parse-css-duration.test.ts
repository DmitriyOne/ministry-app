import { describe, expect, it } from "vitest";

import { parseCssDuration } from "./parse-css-duration";

describe("parseCssDuration", () => {
  it("reads milliseconds", () => {
    expect(parseCssDuration("700ms")).toBe(700);
  });

  it("reads seconds as milliseconds", () => {
    expect(parseCssDuration("1.1s")).toBe(1100);
    expect(parseCssDuration("2s")).toBe(2000);
  });

  // getComputedStyle pads custom property values with whitespace.
  it("tolerates surrounding whitespace", () => {
    expect(parseCssDuration("  1100ms  ")).toBe(1100);
  });

  it("keeps a deliberate zero distinct from a missing value", () => {
    expect(parseCssDuration("0ms")).toBe(0);
    expect(parseCssDuration("")).toBeNull();
  });

  it("rejects a value with no unit", () => {
    expect(parseCssDuration("1100")).toBeNull();
  });

  it("rejects anything that is not a duration", () => {
    expect(parseCssDuration("fast")).toBeNull();
    expect(parseCssDuration("calc(1s + 2s)")).toBeNull();
    expect(parseCssDuration("-200ms")).toBeNull();
  });
});
