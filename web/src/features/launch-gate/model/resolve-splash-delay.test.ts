import { describe, expect, it } from "vitest";

import { resolveSplashDelay } from "./resolve-splash-delay";

const DWELL = 1100;

describe("resolveSplashDelay", () => {
  it("asks for the whole floor when the splash has only just appeared", () => {
    expect(resolveSplashDelay({ nowMs: 300, firstPaintMs: 300, dwellMs: DWELL })).toBe(1100);
  });

  // The regression this function was rewritten for: hydration lands long
  // after the navigation started, but only a moment after the paint. The
  // delay must come from the paint, or the splash leaves before it has
  // finished arriving.
  it("measures from the paint, not from the navigation", () => {
    expect(resolveSplashDelay({ nowMs: 900, firstPaintMs: 420, dwellMs: DWELL })).toBe(620);
  });

  it("asks for nothing once the floor has passed", () => {
    expect(resolveSplashDelay({ nowMs: 1600, firstPaintMs: 400, dwellMs: DWELL })).toBe(0);
  });

  it("never returns a negative delay on a slow start", () => {
    expect(resolveSplashDelay({ nowMs: 9000, firstPaintMs: 300, dwellMs: DWELL })).toBe(0);
  });

  it("rounds to whole milliseconds", () => {
    expect(resolveSplashDelay({ nowMs: 300.4, firstPaintMs: 300, dwellMs: DWELL })).toBe(1100);
  });

  // Without a paint entry there is no way to know what has been shown, so
  // the floor is granted in full rather than guessed at.
  it("grants the full floor when the paint timing is unavailable", () => {
    expect(resolveSplashDelay({ nowMs: 2000, firstPaintMs: null, dwellMs: DWELL })).toBe(1100);
  });

  // A dwell of 0 is how the timing block switches the floor off; it must
  // not be confused with a broken reading, which the caller resolves to
  // its own fallback before getting here.
  it("honours a floor of zero", () => {
    expect(resolveSplashDelay({ nowMs: 300, firstPaintMs: 300, dwellMs: 0 })).toBe(0);
  });

  it("treats an unusable floor as no floor", () => {
    expect(resolveSplashDelay({ nowMs: 300, firstPaintMs: 300, dwellMs: Number.NaN })).toBe(0);
  });
});
