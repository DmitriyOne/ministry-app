// How long a screen waits for Supabase before treating the read as
// failed, and why there is a number here at all.
//
// Three mechanisms already stand between a slow database and a stuck
// screen, and this is only the third of them:
//
//   1. Postgres kills a slow QUERY itself. Supabase sets
//      statement_timeout per role — `anon` 3s, `authenticated` 8s — and
//      the local stack has the same values (checked in pg_roles), so a
//      query that runs too long comes back as an error without any help
//      from us. This is the mechanism Supabase's own timeouts guide
//      points at, and it needs no code.
//   2. supabase-js retries a FAILED read by itself (since v2.102: GET
//      and HEAD only, exponential backoff). A database that is down
//      therefore answers "failed" rather than hanging — measured at
//      roughly seven seconds per query, four attempts, 1s/2s/4s apart.
//      `.rpc()` is a POST and is not retried.
//   3. Neither covers a request that HANGS — accepted by the socket and
//      never answered, which is what an exhausted pool or a stalled
//      network path looks like. Supabase's documentation is explicit:
//      "a request that hangs never fails, so it never reaches the retry
//      logic. Pass an AbortSignal to cap how long a request can take."
//      That is this.
//
// Five seconds, the same figure the connectivity probe uses
// (NETWORK_CONFIG, ADR 0055) — repeated rather than imported because
// shared cannot reach into a feature, and the two answer the same
// question: how long is it still worth waiting. It also caps the retry
// ladder above, which is what takes /day's two reads from fourteen
// seconds to five with the database stopped.
//
// ONE budget per screen, not per query: a screen's reads often run in
// sequence — the day depends on the time zone — so a deadline each would
// add up to one timeout per read of skeleton.
export const SUPABASE_QUERY_TIMEOUT_MS = 5000;

// What the reads after the first are always given, even when the first
// one spent the budget. Without a floor a sharing screen starves its own
// second wave: /profile answered in 4.8s would hand its two RPCs 200ms,
// they would come back aborted, and the screen would render as though it
// had loaded — with the person's status and goals missing and nothing
// saying why. The cap on the screen becomes "five seconds, plus a last
// chance" rather than five exactly, which is the cheaper of the two
// wrong answers.
const SUPABASE_QUERY_MIN_TIMEOUT_MS = 1500;

// The deadline for one read, measured from where the SCREEN's reads
// began. `started` is a Date.now() taken once, at the top of the read
// module; every query in it asks for a fresh signal rather than sharing
// one, because a shared signal keeps counting while the earlier queries
// run.
//
// A signal and not a number: supabase-js only accepts one, and an
// aborted request comes back as `{ error }` with an empty code (checked
// against postgrest-js 2.116) rather than throwing — which is why every
// read here branches on `error` and none of them is wrapped in a
// try/catch.
export const queryDeadline = (started: number): AbortSignal =>
  AbortSignal.timeout(
    Math.max(SUPABASE_QUERY_MIN_TIMEOUT_MS, SUPABASE_QUERY_TIMEOUT_MS - (Date.now() - started)),
  );
