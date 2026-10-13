import { describe, expect, it } from "vitest";

import { resolveSplashDelay } from "./resolve-splash-delay";

describe("resolveSplashDelay", () => {
  it("asks for the whole floor when nothing has been shown yet", () => {
    expect(resolveSplashDelay({ elapsedMs: 0 })).toBe(420);
  });

  it("asks only for what is left of the floor", () => {
    expect(resolveSplashDelay({ elapsedMs: 120 })).toBe(300);
  });

  it("asks for nothing once the floor has already passed", () => {
    expect(resolveSplashDelay({ elapsedMs: 420 })).toBe(0);
  });

  // A slow cold start: the splash has been on screen far longer than the
  // floor, so it must leave at once rather than be held back.
  it("never returns a negative delay on a slow start", () => {
    expect(resolveSplashDelay({ elapsedMs: 3200 })).toBe(0);
  });

  it("rounds to whole milliseconds", () => {
    expect(resolveSplashDelay({ elapsedMs: 100.4 })).toBe(320);
  });

  // performance.now() should never produce either of these, but the delay
  // is what keeps the splash legible — degrade towards showing it.
  it("falls back to the full floor on an unusable reading", () => {
    expect(resolveSplashDelay({ elapsedMs: Number.NaN })).toBe(420);
    expect(resolveSplashDelay({ elapsedMs: -1 })).toBe(420);
  });
});
