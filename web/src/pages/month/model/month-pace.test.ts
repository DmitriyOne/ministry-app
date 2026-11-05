import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config", () => ({ routes: { month: "/month" } }));

const { monthPace } = await import("./month-pace");
const { toDayKey } = await import("@/entities/ministry-day");
const { toMonthKey } = await import("@/entities/ministry-status");

const june = toMonthKey(2026, 6);

describe("monthPace", () => {
  // The owner's own two examples, 2026-11-02.
  it("is two hours behind on 12 h of a 30 h goal by the 14th", () => {
    const pace = monthPace({
      month: june,
      today: toDayKey(2026, 6, 14),
      servedMinutes: 12 * 60,
      goalHours: 30,
    });

    expect(pace?.neededMinutes).toBe(14 * 60);
    expect(pace?.standing).toEqual({ kind: "behind", minutes: 2 * 60 });
  });

  it("is twelve hours ahead on 21 h of a 15 h goal by the 18th", () => {
    const pace = monthPace({
      month: june,
      today: toDayKey(2026, 6, 18),
      servedMinutes: 21 * 60,
      goalHours: 15,
    });

    expect(pace?.neededMinutes).toBe(9 * 60);
    expect(pace?.standing).toEqual({ kind: "ahead", minutes: 12 * 60 });
  });

  // What the whole-hour version could not say, and the reason the owner
  // turned it down: 50 h over 30 days is 18 h 20 min by the 11th.
  it("keeps the odd minutes on both sides", () => {
    const pace = monthPace({
      month: june,
      today: toDayKey(2026, 6, 11),
      servedMinutes: 17 * 60,
      goalHours: 50,
    });

    expect(pace?.neededMinutes).toBe(18 * 60 + 20);
    expect(pace?.standing).toEqual({ kind: "behind", minutes: 80 });
  });

  it("calls an exact match level rather than zero", () => {
    expect(monthPace({
      month: june,
      today: toDayKey(2026, 6, 14),
      servedMinutes: 14 * 60,
      goalHours: 30,
    })?.standing).toEqual({ kind: "level" });
  });

  it("spreads what is left over the days left, today included", () => {
    // 32 h left over the 20 days from the 11th to the 30th: 96 min each,
    // which divides exactly.
    expect(monthPace({
      month: june,
      today: toDayKey(2026, 6, 11),
      servedMinutes: 18 * 60,
      goalHours: 50,
    })?.rest).toEqual({ perDayMinutes: 96, days: 20 });
  });

  it("rounds the daily rate up, so it reaches the goal", () => {
    // 10 h left over 3 days is 200 minutes exactly; 10 h 1 min would not
    // be reached by 200.
    expect(monthPace({
      month: june,
      today: toDayKey(2026, 6, 28),
      servedMinutes: 40 * 60 - 1,
      goalHours: 50,
    })?.rest).toEqual({ perDayMinutes: 201, days: 3 });
  });

  it("has nothing left to spread once the goal is reached", () => {
    expect(monthPace({
      month: june,
      today: toDayKey(2026, 6, 11),
      servedMinutes: 50 * 60,
      goalHours: 50,
    })?.rest).toBeNull();
  });

  it("asks for the whole goal on the last day of the month", () => {
    const pace = monthPace({
      month: june,
      today: toDayKey(2026, 6, 30),
      servedMinutes: 0,
      goalHours: 50,
    });

    expect(pace?.neededMinutes).toBe(50 * 60);
    expect(pace?.rest).toEqual({ perDayMinutes: 50 * 60, days: 1 });
  });

  it("counts February's length from the month itself", () => {
    // 28 h over 28 days is an hour a day: by the 7th, 7 h.
    expect(monthPace({
      month: toMonthKey(2026, 2),
      today: toDayKey(2026, 2, 7),
      servedMinutes: 10 * 60,
      goalHours: 28,
    })?.standing).toEqual({ kind: "ahead", minutes: 3 * 60 });
  });

  it("says nothing about a month that is not the one being lived", () => {
    expect(monthPace({
      month: june,
      today: toDayKey(2026, 7, 1),
      servedMinutes: 0,
      goalHours: 50,
    })).toBeNull();
    expect(monthPace({
      month: june,
      today: toDayKey(2026, 5, 31),
      servedMinutes: 0,
      goalHours: 50,
    })).toBeNull();
  });

  it("says nothing without a goal or without the person's calendar", () => {
    expect(monthPace({
      month: june,
      today: toDayKey(2026, 6, 14),
      servedMinutes: 600,
      goalHours: null,
    })).toBeNull();
    expect(monthPace({
      month: june,
      today: null,
      servedMinutes: 600,
      goalHours: 50,
    })).toBeNull();
  });
});
