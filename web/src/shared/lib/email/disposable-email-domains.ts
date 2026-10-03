// This list can never be complete: new disposable-mail domains appear
// constantly. It is a speed bump against casual throwaway addresses, not
// a gate — nothing may depend on it being exhaustive.
//
// The two groups below are rejected for different reasons, so they are
// kept apart.

// Group 1 — reserved names that can never receive mail. Not a judgement
// about the person: such an address is undeliverable by definition
// (RFC 2606, RFC 6761).
export const RESERVED_DOMAINS: ReadonlySet<string> = new Set([
  "example.com",
  "example.net",
  "example.org",
]);

// Reserved top-level labels (RFC 2606 / 6761), matched by the address's
// last label, not by exact domain.
export const RESERVED_TOP_LEVEL_LABELS: ReadonlySet<string> = new Set([
  "example",
  "invalid",
  "localhost",
  "test",
]);

// Group 2 — well-known disposable inbox providers (kept sorted, unique).
export const DISPOSABLE_PROVIDER_DOMAINS: ReadonlySet<string> = new Set([
  "10minutemail.com",
  "33mail.com",
  "armyspy.com",
  "burnermail.io",
  "cuvox.de",
  "dayrep.com",
  "discard.email",
  "dispostable.com",
  "einrot.com",
  "emailondeck.com",
  "fakeinbox.com",
  "fleckens.hu",
  "getnada.com",
  "grr.la",
  "guerrillamail.com",
  "guerrillamailblock.com",
  "gustr.com",
  "jetable.org",
  "jourrapide.com",
  "maildrop.cc",
  "mailinator.com",
  "mailnesia.com",
  "mailsac.com",
  "minuteinbox.com",
  "mintemail.com",
  "moakt.com",
  "mohmal.com",
  "mytrashmail.com",
  "nada.email",
  "rhyta.com",
  "sharklasers.com",
  "spam4.me",
  "spamgourmet.com",
  "superrito.com",
  "teleworm.us",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.de",
  "yopmail.com",
]);
