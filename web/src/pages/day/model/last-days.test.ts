import { describe, expect, it, vi } from "vitest";

// The module reaches the entity's barrel, which reaches @/shared/config
// for routes (dayPath). That barrel builds env.ts, which fails outside a
// configured environment — so the config is stubbed, as in the other
// tests of this slice.
vi.mock("@/shared/config", () => ({ routes: { day: "/day" } }));

import type { DayKey } from "@/entities/ministry-day";

import {
  firstPaintDays,
  isFutureDay,
  lastDaysSpan,
  stripDays,
  visibleDays,
} from "./last-days";

const day = (value: string) => value as DayKey;

describe("lastDaysSpan", () => {
  // Two months back, to the FIRST of that month: a strip that stopped
  // halfway through a month could not be read for that month, and
  // reading a month whole is the reason to go back at all.
  it("starts on the first of the month two months back", () => {
    expect(lastDaysSpan(day("2026-06-10"))).toEqual({
      from: day("2026-04-01"),
      to: day("2026-06-30"),
    });
  });

  // The day of the month changes nothing at the near end, which is what
  // makes the floor a month rather than a date.
  it("starts in the same place wherever in the month the open day is", () => {
    expect(lastDaysSpan(day("2026-06-01")).from).toEqual(lastDaysSpan(day("2026-06-30")).from);
  });

  // The far end is the month's own last day, whatever length it has:
  // nothing here knows about February, and nothing has to.
  it("ends a short month on its own last day", () => {
    expect(lastDaysSpan(day("2026-02-03")).to).toEqual(day("2026-02-28"));
  });

  it("ends a leap February on the 29th", () => {
    expect(lastDaysSpan(day("2028-02-03")).to).toEqual(day("2028-02-29"));
  });

  it("crosses the start of a year going back", () => {
    expect(lastDaysSpan(day("2026-01-10"))).toEqual({
      from: day("2025-11-01"),
      to: day("2026-01-31"),
    });
  });

  // The window is what the DOM will hold, so its size is worth pinning:
  // a floor that quietly became a year would fail no other test here.
  it("never holds more than three months of chips", () => {
    const widest = stripDays(lastDaysSpan(day("2026-07-31")), []);

    expect(widest.length).toBeLessThanOrEqual(92);
    expect(widest[0].day).toEqual(day("2026-05-01"));
  });
});

describe("stripDays", () => {
  const span = { from: day("2026-06-04"), to: day("2026-06-08") };

  it("gives a chip for every day of the span, oldest first", () => {
    expect(stripDays(span, []).map(({ day: d }) => d)).toEqual([
      day("2026-06-04"),
      day("2026-06-05"),
      day("2026-06-06"),
      day("2026-06-07"),
      day("2026-06-08"),
    ]);
  });

  it("gives one day for a span of one", () => {
    expect(stripDays({ from: day("2026-06-04"), to: day("2026-06-04") }, [])).toEqual([
      { day: day("2026-06-04"), minutes: null },
    ]);
  });

  it("puts the minutes of a day that has a row against that day", () => {
    expect(stripDays(span, [
      { day: "2026-06-05", minutes: 135 },
      { day: "2026-06-08", minutes: 45 },
    ])).toEqual([
      { day: day("2026-06-04"), minutes: null },
      { day: day("2026-06-05"), minutes: 135 },
      { day: day("2026-06-06"), minutes: null },
      { day: day("2026-06-07"), minutes: null },
      { day: day("2026-06-08"), minutes: 45 },
    ]);
  });

  // The difference the table keeps (ADR 0062) and the strip shows: a
  // dash is a day nobody filled in, 0:00 is a day filled in as nothing.
  it("keeps a recorded zero apart from a day with no row", () => {
    expect(stripDays({ from: day("2026-06-05"), to: day("2026-06-06") }, [
      { day: "2026-06-05", minutes: 0 },
    ])).toEqual([
      { day: day("2026-06-05"), minutes: 0 },
      { day: day("2026-06-06"), minutes: null },
    ]);
  });

  // A row outside the span cannot reach the strip: it is drawn from the
  // days, not from the rows, so a wider answer than asked for changes
  // nothing.
  it("ignores a row outside the span", () => {
    expect(stripDays(span, [{ day: "2026-05-01", minutes: 600 }])).toEqual(stripDays(span, []));
  });

  it("crosses a month boundary", () => {
    expect(stripDays({ from: day("2026-02-27"), to: day("2026-03-02") }, [
      { day: "2026-02-28", minutes: 60 },
    ])).toEqual([
      { day: day("2026-02-27"), minutes: null },
      { day: day("2026-02-28"), minutes: 60 },
      { day: day("2026-03-01"), minutes: null },
      { day: day("2026-03-02"), minutes: null },
    ]);
  });
});

describe("isFutureDay", () => {
  it("calls a later day future", () => {
    expect(isFutureDay(day("2026-06-11"), day("2026-06-10"))).toBe(true);
  });

  it("does not call today future", () => {
    expect(isFutureDay(day("2026-06-10"), day("2026-06-10"))).toBe(false);
  });

  it("does not call a day already lived future", () => {
    expect(isFutureDay(day("2026-06-09"), day("2026-06-10"))).toBe(false);
  });

  // With no zone read there is no "today", and a day greyed out on a
  // guess could be one the person has already served.
  it("calls nothing future when today is unknown", () => {
    expect(isFutureDay(day("2026-06-11"), null)).toBe(false);
  });
});

describe("visibleDays", () => {
  const days = stripDays({ from: day("2026-06-08"), to: day("2026-06-12") }, []);

  it("shows the whole span when today is known", () => {
    expect(visibleDays(days, day("2026-06-10"), day("2026-06-10"))).toEqual(days);
  });

  // The pair with isFutureDay: nothing past the open day is drawn, so
  // no chip exists that we cannot say the truth about.
  it("stops at the open day when today is unknown", () => {
    expect(visibleDays(days, day("2026-06-10"), null).map(({ day: d }) => d)).toEqual([
      day("2026-06-08"),
      day("2026-06-09"),
      day("2026-06-10"),
    ]);
  });
});

describe("firstPaintDays", () => {
  const days = stripDays({ from: day("2026-06-01"), to: day("2026-06-30") }, []);

  // Seven chips: the week behind the open day and the open day itself —
  // the strip as it looked when it could not scroll, and what the
  // skeleton draws.
  it("keeps six days behind the open one", () => {
    const shown = firstPaintDays(days, day("2026-06-10"));

    expect(shown[0].day).toEqual(day("2026-06-04"));
    expect(shown.some(({ day: d }) => d === day("2026-06-10"))).toBe(true);
  });

  // Everything after the open day is already on the right of it, so it
  // stays: those chips cost nothing and the strip would otherwise end
  // in a different place on the first frame than on the second.
  it("keeps everything after the open day", () => {
    expect(firstPaintDays(days, day("2026-06-10")).at(-1)?.day).toEqual(day("2026-06-30"));
  });

  it("starts where the window starts when there is less than a week behind", () => {
    expect(firstPaintDays(days, day("2026-06-03"))[0].day).toEqual(day("2026-06-01"));
  });

  // The zone read failed, visibleDays cut the strip at the open day,
  // and the open day is then the last chip — nothing to find beyond it.
  it("works when the open day is the last chip", () => {
    const cut = stripDays({ from: day("2026-06-01"), to: day("2026-06-10") }, []);

    expect(firstPaintDays(cut, day("2026-06-10")).map(({ day: d }) => d)).toEqual([
      day("2026-06-04"),
      day("2026-06-05"),
      day("2026-06-06"),
      day("2026-06-07"),
      day("2026-06-08"),
      day("2026-06-09"),
      day("2026-06-10"),
    ]);
  });

  // A strip that does not contain the open day at all cannot happen —
  // the window is built around it — and if it ever did, showing the
  // whole thing is the answer that loses nothing.
  it("gives everything back when the open day is not in the list", () => {
    expect(firstPaintDays(days, day("2026-07-01"))).toEqual(days);
  });
});
