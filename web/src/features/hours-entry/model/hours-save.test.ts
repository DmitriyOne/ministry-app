import { describe, expect, it } from "vitest";

import {
  HOURS_SAVE_ATTEMPTS,
  needsSave,
  reactionTo,
  rollbackTarget,
} from "./hours-save";

describe("reactionTo", () => {
  it("keeps the number when the server took it", () => {
    expect(reactionTo("success", 1)).toEqual({ kind: "keep" });
  });

  // Only an answer rolls the card back, and only these two are answers.
  it("rolls back on a refusal and says so", () => {
    expect(reactionTo("refused", 1)).toEqual({ kind: "rollback", reason: "refused" });
  });

  // A session that died while the screen was open: the likeliest failure
  // of the three, and "check the date on your phone" would be a lie
  // about it.
  it("rolls back on a dead session under its own name", () => {
    expect(reactionTo("signedOut", 1)).toEqual({ kind: "rollback", reason: "signedOut" });
  });

  // The case that cost the most to find: the row may well have been
  // written and only the reply lost, so rolling back would take away
  // hours the database holds and say they were not saved.
  it("sends the number again while there are attempts left", () => {
    expect(reactionTo("unavailable", 1)).toEqual({ kind: "retry" });
    expect(reactionTo("unavailable", HOURS_SAVE_ATTEMPTS - 1)).toEqual({ kind: "retry" });
  });

  it("keeps the number and calls it unconfirmed once the attempts run out", () => {
    expect(reactionTo("unavailable", HOURS_SAVE_ATTEMPTS)).toEqual({ kind: "unconfirmed" });
  });
});

describe("rollbackTarget", () => {
  // Nothing was in flight besides the refused value: the card goes back
  // to what the server holds.
  it("takes off the rejected delta", () => {
    expect(rollbackTarget(15, 0, 15)).toBe(0);
  });

  // The taps that landed while the request was away were never sent to
  // anybody, so a refusal says nothing about them.
  it("keeps the taps made while the save was in flight", () => {
    expect(rollbackTarget(45, 0, 15)).toBe(30);
  });

  it("keeps them when the server already held something", () => {
    expect(rollbackTarget(90, 30, 60)).toBe(60);
  });

  // Clamped by the same arithmetic the buttons use: the result is still a
  // number a day can hold.
  it("never lands outside the day", () => {
    expect(rollbackTarget(0, 0, 60)).toBe(0);
    expect(rollbackTarget(1440, 1440, 0)).toBe(1440);
  });
});

describe("needsSave", () => {
  it("sends a number the server does not have", () => {
    expect(needsSave(75, 60)).toBe(true);
  });

  // Two taps up and two taps down: the right number of requests is none.
  it("sends nothing once the card is back where the server is", () => {
    expect(needsSave(60, 60)).toBe(false);
  });
});
