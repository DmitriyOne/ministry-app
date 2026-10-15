import { describe, expect, it } from "vitest";

import { resolveKeyboardInset } from "./resolve-keyboard-inset";

describe("resolveKeyboardInset", () => {
  it("is zero when the visual viewport fills the layout viewport", () => {
    expect(resolveKeyboardInset({ innerHeight: 844, viewportHeight: 844 })).toBe(0);
  });

  it("ignores the browser chrome collapsing and expanding", () => {
    // Safari's address bar is tens of pixels, not hundreds; reacting to it
    // would make the layout twitch during an ordinary scroll.
    expect(resolveKeyboardInset({ innerHeight: 844, viewportHeight: 790 })).toBe(0);
  });

  it("reports the keyboard's height when one is open", () => {
    expect(resolveKeyboardInset({ innerHeight: 844, viewportHeight: 508 })).toBe(336);
  });

  it("rounds to whole pixels", () => {
    expect(resolveKeyboardInset({ innerHeight: 844, viewportHeight: 507.6 })).toBe(336);
  });

  it("is zero when the visual viewport is somehow taller", () => {
    expect(resolveKeyboardInset({ innerHeight: 844, viewportHeight: 900 })).toBe(0);
  });

  it("is zero when a measurement is not a number", () => {
    expect(resolveKeyboardInset({ innerHeight: Number.NaN, viewportHeight: 508 })).toBe(0);
  });
});
