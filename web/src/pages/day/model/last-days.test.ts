import { describe, expect, it, vi } from "vitest";

// The module reaches the entity's barrel, which reaches @/shared/config
// for routes (dayPath). That barrel builds env.ts, which fails outside a
// configured environment — so the config is stubbed, as in the other
// tests of this slice.
vi.mock("@/shared/config", () => ({ routes: { day: "/day" } }));

import type { DayKey } from "@/entities/ministry-day";

import { previousDays, previousDaysSpan } from "./last-days";

const day = (value: string) => value as DayKey;

describe("previousDaysSpan", () => {
  it("ends the day before the open one", () => {
    expect(previousDaysSpan(day("2026-06-10"))).toEqual({
      from: day("2026-06-04"),
      to: day("2026-06-09"),
    });
  });

  it("crosses the start of a month", () => {
    expect(previousDaysSpan(day("2026-06-02"))).toEqual({
      from: day("2026-05-27"),
      to: day("2026-06-01"),
    });
  });

  it("crosses the start of a year", () => {
    expect(previousDaysSpan(day("2026-01-01"))).toEqual({
      from: day("2025-12-26"),
      to: day("2025-12-31"),
    });
  });
});

describe("previousDays", () => {
  it("gives six days, oldest first, ending the day before the open one", () => {
    expect(previousDays(day("2026-06-10"), []).map(({ day: d }) => d)).toEqual([
      day("2026-06-04"),
      day("2026-06-05"),
      day("2026-06-06"),
      day("2026-06-07"),
      day("2026-06-08"),
      day("2026-06-09"),
    ]);
  });

  it("does not include the open day, whose number is the card's", () => {
    expect(previousDays(day("2026-06-10"), [{ day: "2026-06-10", minutes: 120 }]))
      .not.toContainEqual({ day: day("2026-06-10"), minutes: 120 });
  });

  it("puts the minutes of a day that has a row against that day", () => {
    expect(previousDays(day("2026-06-10"), [
      { day: "2026-06-05", minutes: 135 },
      { day: "2026-06-09", minutes: 45 },
    ])).toEqual([
      { day: day("2026-06-04"), minutes: null },
      { day: day("2026-06-05"), minutes: 135 },
      { day: day("2026-06-06"), minutes: null },
      { day: day("2026-06-07"), minutes: null },
      { day: day("2026-06-08"), minutes: null },
      { day: day("2026-06-09"), minutes: 45 },
    ]);
  });

  // The difference the table keeps (ADR 0062) and the strip shows: a
  // dash is a day nobody filled in, 0:00 is a day filled in as nothing.
  it("keeps a recorded zero apart from a day with no row", () => {
    const [first, second] = previousDays(day("2026-06-06"), [{ day: "2026-06-05", minutes: 0 }])
      .slice(-2);

    expect(first).toEqual({ day: day("2026-06-04"), minutes: null });
    expect(second).toEqual({ day: day("2026-06-05"), minutes: 0 });
  });

  // A row outside the span cannot reach the strip: it is drawn from the
  // days, not from the rows, so a wider answer than asked for changes
  // nothing.
  it("ignores a row outside the six days", () => {
    expect(previousDays(day("2026-06-10"), [{ day: "2026-05-01", minutes: 600 }]))
      .toEqual(previousDays(day("2026-06-10"), []));
  });

  it("crosses a month boundary", () => {
    expect(previousDays(day("2026-03-02"), [{ day: "2026-02-28", minutes: 60 }])).toEqual([
      { day: day("2026-02-24"), minutes: null },
      { day: day("2026-02-25"), minutes: null },
      { day: day("2026-02-26"), minutes: null },
      { day: day("2026-02-27"), minutes: null },
      { day: day("2026-02-28"), minutes: 60 },
      { day: day("2026-03-01"), minutes: null },
    ]);
  });
});
