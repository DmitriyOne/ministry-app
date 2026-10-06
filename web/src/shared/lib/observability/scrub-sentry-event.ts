import type { ErrorEvent, Event } from "@sentry/nextjs";

const REDACTED = "[redacted]";

// Deliberately loose: it is better to over-redact a message than to let one
// waitlist address through inside an exception's text.
const EMAIL_PATTERN = /[^\s@<>()[\]"',;:]+@[^\s@<>()[\]"',;:]+\.[^\s@<>()[\]"',;:]+/g;

const SENSITIVE_KEYS = new Set([
  "email",
  "token",
  "enrollmenttoken",
  "p256dh",
  "auth",
  "endpoint",
  "apikey",
  "authorization",
  "secret",
  "password",
]);

// Exported so that anything writing to a server log can reuse the one
// redaction rule rather than inventing a second one. ADR 0026/0027 keep
// addresses out of logs, and an exception's message is text like any other:
// a Postgres or Supabase error can quote the input that caused it.
export const redactEmails = (value: string): string => value.replace(EMAIL_PATTERN, REDACTED);

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Walks any structure and returns a redacted copy; the input is never
// mutated. Strings inside are scrubbed for addresses too, so a nested
// message does not slip through. `seen` guards against cycles.
const scrubValue = (value: unknown, seen: WeakSet<object>): unknown => {
  if (typeof value === "string") return redactEmails(value);
  if (typeof value !== "object" || value === null) return value;
  if (seen.has(value)) return REDACTED;

  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => scrubValue(item, seen));

  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    result[key] = SENSITIVE_KEYS.has(key.toLowerCase()) ? REDACTED : scrubValue(item, seen);
  }

  return result;
};

const scrubEventUnsafe = <T extends Event>(event: T): T => {
  const copy: Record<string, unknown> = { ...(event as Record<string, unknown>) };

  if (typeof event.message === "string") copy.message = redactEmails(event.message);

  if (isPlainObject(event.exception) && Array.isArray(event.exception.values)) {
    copy.exception = {
      ...event.exception,
      values: event.exception.values.map((entry) =>
        isPlainObject(entry) && typeof entry.value === "string"
          ? { ...entry, value: redactEmails(entry.value) }
          : entry,
      ),
    };
  }

  if (Array.isArray(event.breadcrumbs)) {
    copy.breadcrumbs = event.breadcrumbs.map((crumb) =>
      isPlainObject(crumb) && typeof crumb.message === "string"
        ? { ...crumb, message: redactEmails(crumb.message) }
        : crumb,
    );
  }

  if (event.extra !== undefined) copy.extra = scrubValue(event.extra, new WeakSet());
  if (event.contexts !== undefined) copy.contexts = scrubValue(event.contexts, new WeakSet());

  return copy as T;
};

// Removes personal data that could reach Sentry through exception text or
// attached context — chiefly a waitlist email address. Pure and total: it
// never throws and never returns null. If scrubbing itself fails on a
// strangely shaped event, it falls back to dropping the free-text fields
// rather than sending the original.
export const scrubSentryEvent = <T extends ErrorEvent | Event>(event: T): T => {
  try {
    return scrubEventUnsafe(event);
  } catch {
    const rest: Record<string, unknown> = { ...(event as Record<string, unknown>) };
    for (const key of ["message", "exception", "breadcrumbs", "extra", "contexts"]) delete rest[key];

    return rest as T;
  }
};
