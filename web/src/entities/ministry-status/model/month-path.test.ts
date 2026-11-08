import { describe, expect, it, vi } from "vitest";

// The barrel this module imports for the route prefix also exports
// `env`, which validates the environment at import time and throws in a
// plain vitest run. Mocked down to the one thing under test, rather than
// imported deeply: steiger forbids sidestepping a slice's public API,
// and shared/lib's modules only get away with it because shared may
// import shared.
vi.mock("@/shared/config", () => ({ routes: { month: "/month" } }));

import { toMonthKey } from "./month-key";
import { monthPath, parseMonthSlug } from "./month-path";

describe("monthPath", () => {
  it("drops the day, because an address is read by people", () => {
    expect(monthPath(toMonthKey(2026, 6))).toBe("/month/2026-06");
  });

  it("pads a single-digit month", () => {
    expect(monthPath(toMonthKey(2026, 1))).toBe("/month/2026-01");
  });
});

describe("parseMonthSlug", () => {
  it("reads a month back", () => {
    expect(parseMonthSlug("2026-06")).toBe("2026-06-01");
  });

  it("refuses a month number that does not exist", () => {
    expect(parseMonthSlug("2026-13")).toBeNull();
    expect(parseMonthSlug("2026-00")).toBeNull();
  });

  // The shapes close enough to be dangerous: an unpadded month and the
  // database's own key, which would otherwise make two addresses for one
  // screen.
  it("refuses anything that is not YYYY-MM", () => {
    expect(parseMonthSlug("2026-6")).toBeNull();
    expect(parseMonthSlug("2026-06-01")).toBeNull();
    expect(parseMonthSlug("2026")).toBeNull();
    expect(parseMonthSlug("june")).toBeNull();
    expect(parseMonthSlug("")).toBeNull();
  });
});
