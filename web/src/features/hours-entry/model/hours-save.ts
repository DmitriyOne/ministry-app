// What saving a day can answer, and what the card does about it. The
// decisions live here rather than in the hook for the reason
// resolveGate, isNavItemCurrent and the network state do (CLAUDE.md): the
// hook keeps the timer and the state, and the choices a test can reach
// are in a module with no React in it.

import { addMinutes } from "./hours-value";

// Saved; refused (the day has not happened, or the minutes do not fit
// in a day); nobody is signed in any more; or the save did not go
// through — and that last one is TWO answers, not one.
//
// `unreachable` means the request provably never got anywhere: the
// browser has no connection, or the database refused the connection
// outright. Nothing was written, and the card can say so.
// `unknown` means it left and we did not hear back — a deadline that
// fired, a reply lost on the way, an instance recycled mid-answer. The
// row may well be there, so the card must not claim otherwise.
//
// They used to be one status called `unavailable`, which forced one
// behaviour on both: the card kept the number and said it could not be
// confirmed even with the backend plainly down, where "not saved" was
// the plain truth and the number should have come off (the owner,
// 2026-10-27).
// `monthClosed` joined them when a month became something that could be
// reported and left alone (ADR 0066). It is an answer like `refused` —
// the server said no — but a different sentence: the date is fine, the
// month is shut.
export type SetDayHoursStatus
  = "success" | "refused" | "signedOut" | "unreachable" | "unknown" | "monthClosed";

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

// How long "Saved" stays in the card's header before the line goes back
// to saying what the buttons do. Long enough to be read if you were
// looking, short enough that it is gone by the next tap.
export const HOURS_SAVED_SHOWN_MS = 2000;

// The longest the buttons stay out of the person's hands while a save is
// away (the owner's call, 2026-10-27: nothing to tap twice by mistake).
// A normal save answers in a fraction of this; what the cap is for is
// the save that does not, where three attempts and two waits would lock
// the card for half a minute. Past two seconds the card is the person's
// again — the header still says "Saving…", because it still is.
export const HOURS_SAVE_LOCK_MS = 2000;

// What the card's header says about the save, and the reason the hook
// returns it rather than a boolean: "saved" is a third state, held for a
// moment after the request came back, and a boolean would have to be
// two.
export type HoursSaveState = "idle" | "saving" | "saved";

// The wait between attempts. Longer than the debounce, because what we
// are waiting out is a network that just failed, not a finger.
export const HOURS_SAVE_RETRY_DELAY_MS = 1200;

export type SaveReaction
  = { kind: "keep" }
    | { kind: "retry" }
    | { kind: "unconfirmed" }
    | { kind: "rollback"; reason: RollbackReason };

// Why the number came off. Five, because the person is owed five
// different sentences: fix the date, sign in again, we could not reach
// the server, you have no connection, the month is closed. The first two
// and the last come from the server's own answer, the third from a
// connection it refused, and the fourth from the browser before anything
// was sent.
export type RollbackReason
  = "refused" | "signedOut" | "unreachable" | "offline" | "monthClosed";

// What is left once the attempts are over: everything but "retry". The
// loop that sends a value ends in one of these, and naming it is what
// lets the caller handle three cases rather than four.
export type SettledSaveReaction = Exclude<SaveReaction, { kind: "retry" }>;

// The one rule this module exists for: the number on screen is the
// person's, and it may only be taken away from them when we KNOW the
// server does not have it.
//
// `unknown` is the case that is not knowing. Behind it sits the worst
// outcome available to an app that counts hours: the row was written and
// the reply was lost — a deadline that fired after the commit, a signal
// dropped on the way back, an instance recycled mid-reply. Rolling back
// there put the card back to the old number and said "those hours
// weren't saved" while the database held the new one, and nothing on
// screen ever corrected it, because the card reads the server's number
// once, at mount.
//
// So `unknown` sends the number again (the write is idempotent), and
// when the attempts run out it keeps the number and says it could not be
// CONFIRMED. The other three roll back, each under its own name:
// `refused` and `signedOut` because the server answered, `unreachable`
// because nothing ever reached it. `unreachable` still gets its retries
// — a connection refused for two seconds is worth asking about twice —
// but it ends in the honest sentence rather than the careful one.
export const reactionTo = (status: SetDayHoursStatus, attempt: number): SaveReaction => {
  if (status === "success") return { kind: "keep" };

  if (status === "unknown") {
    return attempt < HOURS_SAVE_ATTEMPTS ? { kind: "retry" } : { kind: "unconfirmed" };
  }

  if (status === "unreachable") {
    return attempt < HOURS_SAVE_ATTEMPTS
      ? { kind: "retry" }
      : { kind: "rollback", reason: "unreachable" };
  }

  return { kind: "rollback", reason: status };
};

// The error codes a connection carries when it was never established:
// the host did not resolve, or the port refused. A write cannot have
// happened behind one of them, which is what separates them from
// everything else that goes wrong — a timeout, a reset, a 5xx — where
// the statement may be running still.
//
// ECONNRESET is deliberately NOT here. A reset arrives after the socket
// was open, so the server may have taken the request and died answering
// it.
const NEVER_LEFT = ["ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"];

const textOf = (error: unknown, key: "message" | "details"): string => {
  if (typeof error !== "object" || error === null) return "";

  const value = (error as Record<string, unknown>)[key];

  return typeof value === "string" ? value : "";
};

// Which of the two "it did not save" answers a thrown error is. Reads
// the strings because that is where the information is: postgrest-js
// turns a failed fetch into a plain object with `code: ""` for every
// kind of failure, and puts the cause — `ECONNREFUSED` and friends — in
// `details` (checked against the source of @supabase/postgrest-js
// 2.116.0). An abort lands here too, and lands as `unknown`, correctly:
// the deadline may have fired after Postgres committed.
export const classifySaveFailure = (error: unknown): "unreachable" | "unknown" => {
  const haystack = `${textOf(error, "message")} ${textOf(error, "details")}`;

  return NEVER_LEFT.some((code) => haystack.includes(code)) ? "unreachable" : "unknown";
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
