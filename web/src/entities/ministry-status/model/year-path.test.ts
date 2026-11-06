import { describe, expect, it, vi } from "vitest";

// The same mock month-path.test.ts explains at length: the barrel this
// module imports for the route prefix also exports `env`, which
// validates the environment at import time and throws in a plain vitest
// run. Mocked down to the one key under test rather than imported
// deeply, because steiger forbids sidestepping a slice's public API.
vi.mock("@/shared/config", () => ({ routes: { year: "/year" } }));

import { parseMonthKey } from "./month-key";
import { yearHeading } from "./year-label";
import {
  parseYearSlug,
  serviceYearFirstMonth,
  yearPath,
  yearPathOfMonth,
} from "./year-path";

const month = (value: string) => {
  const key = parseMonthKey(value);

  if (key === null) throw new Error(`not a month key: ${value}`);

  return key;
};

describe("yearPath", () => {
  it("is the year it starts in, not the pair", () => {
    expect(yearPath(2026)).toBe("/year/2026");
  });
});

describe("parseYearSlug", () => {
  it("accepts four digits", () => {
    expect(parseYearSlug("2026")).toBe(2026);
  });

  it.each([
    ["2026-2027", "the heading's shape, not the address's"],
    ["2026-09", "a month slug"],
    ["26", "two digits"],
    ["02026", "five digits"],
    ["abcd", "letters"],
    ["", "nothing"],
    [" 2026", "a leading space"],
    ["2026.", "trailing punctuation"],
  ])("rejects %j — %s", (slug) => {
    expect(parseYearSlug(slug)).toBeNull();
  });

  // The bound exists so that /year/0 is a 404 rather than a screen
  // offering to page through nothing.
  it.each(["0000", "1969", "2201", "9999"])("rejects %j, outside the range", (slug) => {
    expect(parseYearSlug(slug)).toBeNull();
  });

  it.each(["1970", "2200"])("accepts %j, the range's own ends", (slug) => {
    expect(parseYearSlug(slug)).toBe(Number(slug));
  });
});

describe("yearPathOfMonth", () => {
  it("sends September to its own year", () => {
    expect(yearPathOfMonth(month("2026-09-01"))).toBe("/year/2026");
  });

  it("sends August to the year that began the September before", () => {
    expect(yearPathOfMonth(month("2027-08-01"))).toBe("/year/2026");
  });

  it("sends January to the year that began the September before", () => {
    expect(yearPathOfMonth(month("2027-01-01"))).toBe("/year/2026");
  });
});

describe("serviceYearFirstMonth", () => {
  it("is September of the year named", () => {
    expect(serviceYearFirstMonth(2026)).toBe("2026-09-01");
  });

  it("round-trips with the month it belongs to", () => {
    expect(yearPathOfMonth(serviceYearFirstMonth(2031))).toBe("/year/2031");
  });
});

describe("yearHeading", () => {
  it("names both years, because one of them is otherwise a question", () => {
    expect(yearHeading(2026)).toBe("2026 / 2027");
  });

  it("crosses a century without padding trouble", () => {
    expect(yearHeading(2099)).toBe("2099 / 2100");
  });
});
