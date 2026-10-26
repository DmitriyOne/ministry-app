// What saving a day can answer, and what the card does about it. The
// decisions live here rather than in the hook for the reason
// resolveGate, isNavItemCurrent and the network state do (CLAUDE.md): the
// hook keeps the timer and the state, and the choices a test can reach
// are in a module with no React in it.

import { addMinutes } from "./hours-value";

// Saved; refused (the day has not happened, or the minutes do not fit in
// a day); nobody is signed in any more; or we could not tell — the
// server did not answer.
export type SetDayHoursStatus = "success" | "refused" | "signedOut" | "unavailable";

// How long after the last tap the save goes out. The card is dialled, not
// typed: a quick-add row and two steppers mean three or four taps land
// inside a second, and sending each of them would spend four requests to
// agree on the last number. Long enough to gather a burst, short enough
// that a person who taps and locks the phone has already been saved.
export const HOURS_SAVE_DELAY_MS = 600;

// How many times one number is sent before we stop asking. Three, and
// they are safe to count on: the write is an upsert keyed by (person,
// day), so sending the same number twice leaves the same row (ADR 0062).
export const HOURS_SAVE_ATTEMPTS = 3;

// How long the card waits for one attempt before calling it a failure.
// The server puts a deadline on the database call (ADR 0062), but the
// CALL ITSELF is a request too: a phone with a stalled radio neither
// answers nor fails, and without this the save that is "running" would
// never finish — every later tap would move the number and save
// nothing, silently, for as long as the screen stayed open. Twice the
// server's own deadline, so a slow-but-alive server answers for itself
// rather than being cut off here.
export const HOURS_SAVE_REQUEST_TIMEOUT_MS = 10_000;

// The wait between attempts. Longer than the debounce, because what we
// are waiting out is a network that just failed, not a finger.
export const HOURS_SAVE_RETRY_DELAY_MS = 1200;

export type SaveReaction
  = { kind: "keep" }
    | { kind: "retry" }
    | { kind: "unconfirmed" }
    | { kind: "rollback"; reason: "refused" | "signedOut" };

// What is left once the attempts are over: everything but "retry". The
// loop that sends a value ends in one of these, and naming it is what
// lets the caller handle three cases rather than four.
export type SettledSaveReaction = Exclude<SaveReaction, { kind: "retry" }>;

// The one rule this module exists for: the number on screen is the
// person's, and it may only be taken away from them by an answer that
// says the server does not have it.
//
// "unavailable" is NOT that answer. It means we do not know, and the
// cases behind it include the worst one there is: the row was written
// and the reply was lost — a deadline that fired after the commit, a
// signal dropped on the way back, an instance recycled mid-reply. Rolling
// back there put the card back to the old number and said "those hours
// weren't saved" while the database held the new one, and nothing on the
// screen ever corrected it: the card reads the server's number once, at
// mount. For an app whose whole subject is counting hours that is the
// worst outcome available, and it is what this shape prevents.
//
// So: send it again (the write is idempotent), and when the attempts run
// out keep the number and say it could not be CONFIRMED — which is true,
// and leaves the person something to do about it. Only "refused" and
// "signedOut" roll back, because only there did the server answer.
export const reactionTo = (status: SetDayHoursStatus, attempt: number): SaveReaction => {
  if (status === "success") return { kind: "keep" };

  if (status === "unavailable") {
    return attempt < HOURS_SAVE_ATTEMPTS ? { kind: "retry" } : { kind: "unconfirmed" };
  }

  return { kind: "rollback", reason: status };
};

// Where the card goes when a save is refused. Not back to the last
// confirmed number: taps made while the request was in flight were never
// sent to anybody, and the server said nothing about them. Only the
// delta that WAS rejected comes off, so two taps up during a failing
// save leave two taps up.
//
// Clamped by the same function the buttons add with, so the result
// cannot land outside a day.
export const rollbackTarget = (target: number, confirmed: number, attempted: number): number =>
  addMinutes(confirmed, target - attempted);

// Whether there is anything to send: the card may well settle back on
// the number the server already holds (two taps up, two taps down), and
// then the right number of requests is none.
export const needsSave = (target: number, confirmed: number): boolean =>
  target !== confirmed;
