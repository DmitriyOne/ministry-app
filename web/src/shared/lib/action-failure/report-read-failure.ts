import "server-only";

import * as Sentry from "@sentry/nextjs";

import { redactEmails } from "../observability";

// What a screen does with a read that did not answer, in one place.
//
// It lives beside reportActionFailure rather than in a segment of its
// own, and the folder's name is the historical one: the first caller was
// an action, and get-session-claims — a read — was already using it
// before this existed. The two also have to be here together: both are
// `server-only`, and shared/lib is at the module count steiger allows,
// so a sixteenth folder would break the build for a rename.
//
// Why it is not reportActionFailure: a failed read hands us a
// PostgrestError, which is a plain object with no stack. Sentry files
// one of those as "Non-Error exception captured" and groups every such
// event together, so the day /day starts answering with a failure card
// for everybody, the one question worth asking — which read, and what
// did it say — would have no answer in the dashboard. Here the event is
// a real Error whose message names the read and the code, and the
// Postgres code goes in a tag so the outages can be told apart from the
// timeouts.
//
// What this does NOT do is decide anything: the screen has already
// chosen what to show. This exists so that a screen full of failure
// cards is also a line somebody can read, which is what it was missing
// — the read returned SCREEN_UNAVAILABLE and said it to no one.
type ReportReadFailureInput = {
  // The read, as it appears in the log line: "[read-day-page] …".
  scope: string;
  // Which question inside it failed — "profile", "minutes", "year-goal".
  // A screen asks several, and "the read failed" does not say which.
  step: string;
  // A PostgrestError, or anything else that came back instead of data.
  error: unknown;
};

const codeOf = (error: unknown): string =>
  typeof error === "object" && error !== null && "code" in error
    ? String((error as { code: unknown }).code)
    : "";

const messageOf = (error: unknown): string =>
  typeof error === "object" && error !== null && "message" in error
    ? String((error as { message: unknown }).message)
    : String(error);

export const reportReadFailure = ({ scope, step, error }: ReportReadFailureInput): void => {
  const code = codeOf(error);
  // An aborted request comes back with an empty code and the hint
  // "Request was aborted (timeout or manual cancellation)" — so the
  // deadline we set ourselves is nameable, rather than filed as an
  // unknown outage.
  const named = code === "" ? "aborted-or-network" : code;
  const message = redactEmails(messageOf(error));

  Sentry.captureException(
    new Error(`[${scope}] ${step} failed (${named}): ${message}`),
    { tags: { read: scope, step, postgrestCode: named } },
  );

  console.warn(`[${scope}] unavailable`, { step, code: named, message });
};
