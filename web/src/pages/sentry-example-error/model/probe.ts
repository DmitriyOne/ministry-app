// Common prefix of every probe message, so the events can be found (and
// muted) in Sentry by searching for it. Explicit sends also carry the
// debug_probe tag; thrown errors cannot be tagged, hence the prefix.
export const SENTRY_PROBE_PREFIX = "[sentry-probe]";

// Looks like a real address on purpose: the scrubber should replace it.
export const SENTRY_PROBE_EMAIL = "probe.user@example.com";
