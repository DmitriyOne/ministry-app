import "server-only";

import { redactEmails } from "../observability";

// What an unknown thrown thing is, in words a log line can carry.
//
// It exists because `error instanceof Error` is false for most of what
// this project actually catches. Supabase hands back a PostgrestError —
// a plain object with `message`, `details`, `hint` and `code`, and no
// prototype — so the old `instanceof` ternary logged
// `{ error: 'object', message: undefined }` and threw away the only two
// facts worth having (the owner, 2026-10-27). A `throw "string"` and a
// rejected promise with no reason behave the same way.
//
// Shared by both reporters in this segment rather than written twice:
// they had a copy each already, and the copies had drifted — the read
// side knew about PostgrestError and the action side did not.
export type DescribedFailure = {
  // What to call it: the error's class, `PostgrestError` for the shape
  // Supabase returns, otherwise the typeof.
  name: string;
  // Its message, with addresses redacted by the same rule the Sentry
  // scrubber uses (ADR 0041). Never undefined: something is always
  // better than nothing in a log read at three in the morning.
  message: string;
  // The Postgres or PostgREST code, or "" when there is none. Empty is
  // also what an aborted request carries, which is why the callers name
  // that case themselves rather than trusting the code alone.
  code: string;
  // Postgres's own `hint`, when it sent one, and "" otherwise. Worth
  // keeping because when the database knows the fix it puts it here —
  // the literal GRANT for a permission error, "Request was aborted…"
  // for a deadline — and `message` alone then says the least useful
  // half of what we were told.
  hint: string;
};

const field = (error: unknown, key: string): string | undefined => {
  if (typeof error !== "object" || error === null) return undefined;

  const value = (error as Record<string, unknown>)[key];

  return value === undefined || value === null ? undefined : String(value);
};

// The shape, not the class: PostgrestError is a plain object here, so
// there is nothing to compare a prototype against. A `message` plus a
// `code` is as close as it gets, and being wrong costs a label in a log.
const looksPostgrest = (error: unknown): boolean =>
  field(error, "message") !== undefined && field(error, "code") !== undefined;

export const describeFailure = (error: unknown): DescribedFailure => {
  const code = field(error, "code") ?? "";

  const name = error instanceof Error
    ? error.name
    : looksPostgrest(error)
      ? "PostgrestError"
      : typeof error;

  // `String(error)` as the last resort rather than JSON: a circular
  // object would throw inside the reporter, which is the one place that
  // must not fail.
  const message = field(error, "message") ?? String(error);

  return { name, message: redactEmails(message), code, hint: field(error, "hint") ?? "" };
};
