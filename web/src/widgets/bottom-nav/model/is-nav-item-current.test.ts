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

  it("leaves the root alone", () => {
    // "/" is one character, so the trailing-slash rule must not reduce it
    // to an empty string and match nothing.
    expect(isNavItemCurrent("/", "/")).toBe(true);
  });
});
