import { describe, expect, it } from "vitest";

import { isNavItemCurrent } from "./is-nav-item-current";

describe("isNavItemCurrent", () => {
  it("matches the item for the open page", () => {
    expect(isNavItemCurrent("/calendar", "/calendar")).toBe(true);
  });

  it("ignores a trailing slash on the pathname", () => {
    expect(isNavItemCurrent("/calendar/", "/calendar")).toBe(true);
  });

  it("does not match a different page", () => {
    expect(isNavItemCurrent("/month", "/calendar")).toBe(false);
  });

  it("does not match by prefix", () => {
    // A future /month-summary must not light the Month item up.
    expect(isNavItemCurrent("/month-summary", "/month")).toBe(false);
  });

  // /day's screens carry their date, so the exact comparison alone would
  // leave the menu unlit on the screen people use most (ADR 0063).
  it("matches an address under an item that owns its family", () => {
    expect(isNavItemCurrent("/day/2026-06-02", "/day", true)).toBe(true);
    expect(isNavItemCurrent("/day", "/day", true)).toBe(true);
  });

  it("matches nothing under an item that does not own one", () => {
    expect(isNavItemCurrent("/day/2026-06-02", "/day")).toBe(false);
  });

  // Even the item that opts in needs the separator: a family is not a
  // coincidence of spelling.
  it("is not fooled by a similar name even with a family", () => {
    expect(isNavItemCurrent("/day-summary", "/day", true)).toBe(false);
    expect(isNavItemCurrent("/days/2026-06-02", "/day", true)).toBe(false);
  });

  it("leaves the root alone", () => {
    // "/" is one character, so the trailing-slash rule must not reduce it
    // to an empty string and match nothing.
    expect(isNavItemCurrent("/", "/")).toBe(true);
  });
});
