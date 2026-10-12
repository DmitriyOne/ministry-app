import "server-only";

import * as Sentry from "@sentry/nextjs";

import { redactEmails } from "../observability";

// What a Server Action does with an exception it did not expect, in one
// place.
//
// A segment of its own rather than a second export from
// shared/lib/observability, for a reason the build states outright: this
// module is `server-only`, that barrel is imported by
// instrumentation-client.ts for scrubSentryEvent, and one barrel spanning
// both runtimes fails the build with "'server-only' cannot be imported
// from a Client Component module". Importing past a barrel is not the way
// out — steiger forbids it (fsd/no-public-api-sidestep) — so the
// server-only piece gets its own public API. The same trap ADR 0034
// records for the Supabase barrel, met from the other side. Three actions had written this out, identically but not quite,
// and a fourth (join-waitlist) swallowed the error altogether — so a
// failing sign-up left nothing anywhere to read.
//
// Two destinations on purpose. Sentry gets the whole exception, stack
// included, and beforeSend runs it through scrubSentryEvent, so an
// address quoted inside a message never leaves the process (ADR 0041).
// The server log gets what can be read at a glance and carries no
// personal data: which action, which step, the error's class, and its
// message with addresses redacted by the same rule the scrubber uses.
//
// Sentry is off outside production (ADR 0041, update), so in development
// the log is all there is — which is why it carries the message rather
// than only the class.
type ReportActionFailureInput = {
  // The action, as it appears in the log line: "[sign-in] …".
  scope: string;
  error: unknown;
  // What the action did about it. "rejected" is the usual case — the
  // person is told it did not work. Sign-out passes "failed": it reports
  // the error and carries on to the redirect regardless, and calling that
  // a rejection would read as if something had been refused.
  outcome?: "rejected" | "failed";
  // Anything that says more than "something failed" — which step threw,
  // a status code. Never a value a person typed.
  context?: Record<string, unknown>;
};

export const reportActionFailure = (
  { scope, error, outcome = "rejected", context }: ReportActionFailureInput,
): void => {
  Sentry.captureException(error);

  console.warn(`[${scope}] ${outcome}`, {
    reason: "threw",
    ...context,
    error: error instanceof Error ? error.name : typeof error,
    message: error instanceof Error ? redactEmails(error.message) : undefined,
  });
};
