import { describe, expect, it, vi } from "vitest";

vi.mock("@/shared/config", () => ({ routes: { day: "/day", month: "/month" } }));

import { toMonthKey } from "@/entities/ministry-status";

import { monthClosingState } from "./month-closing";

const june = toMonthKey(2026, 6);
const may = toMonthKey(2026, 5);
const july = toMonthKey(2026, 7);

describe("monthClosingState", () => {
  // The owner's rule: the button appears after midnight of the following
  // month. Until then there is no button at all, not a disabled one.
  it("offers nothing while the month is being lived", () => {
    expect(monthClosingState({ month: june, currentMonth: june, isClosed: false }))
      .toBe("hidden");
  });

  it("offers closing once the month is over", () => {
    expect(monthClosingState({ month: may, currentMonth: june, isClosed: false }))
      .toBe("closable");
  });

  it("says closed when it is closed", () => {
    expect(monthClosingState({ month: may, currentMonth: june, isClosed: true }))
      .toBe("closed");
  });

  // A month ahead of the current one cannot be closed either. The route
  // sends it to a 404 before this is asked, so this is the backstop.
  it("offers nothing for a month that has not started", () => {
    expect(monthClosingState({ month: july, currentMonth: june, isClosed: false }))
      .toBe("hidden");
  });

  // The zone did not read. Offering to close a month we cannot place in
  // time would let somebody close the month they are standing in.
  it("offers nothing when the current month is unknown", () => {
    expect(monthClosingState({ month: may, currentMonth: null, isClosed: false }))
      .toBe("hidden");
  });

  // Already closed is a fact about the row, not a judgement about time:
  // it stays true even when we cannot say what month it is now, so the
  // way out is never hidden.
  it("still says closed when the current month is unknown", () => {
    expect(monthClosingState({ month: may, currentMonth: null, isClosed: true }))
      .toBe("closed");
  });
});
