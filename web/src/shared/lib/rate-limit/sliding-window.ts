import "server-only";

// In-memory sliding-window limiter. Honest limitation (see ADR on the
// waitlist form's spam protection): on Vercel a single logical deployment
// can run as several concurrently-invoked serverless/edge instances, each
// with its own copy of this module's state. There is no shared memory
// between them, so the *effective* limit is the configured limit
// multiplied by however many instances happen to handle traffic — and any
// count resets whenever an instance is recycled after being idle. This is
// an acceptable trade-off for a low-traffic waitlist form (see the
// feature-level limiter for the numbers and reasoning), not a promise of
// an exact global cap. A durable, cross-instance limit would need shared
// storage (e.g. Upstash Redis, which Vercel documents for exactly this
// case) — out of scope until the form sees real abuse.
export type RateLimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
};

type SlidingWindowOptions = {
  limit: number;
  windowMs: number;
};

export type ConsumeOptions = {
  // false asks the limiter whether the key is over the limit WITHOUT
  // counting this call as an attempt. It exists for the case where the
  // caller only learns afterwards whether the attempt should count at all
  // — sign-in charges failed password checks, not successful logins or a
  // backend that did not answer (ADR 0043, update). Default is true, so
  // every existing caller keeps the check-and-count behaviour.
  record?: boolean;
};

const CLEANUP_INTERVAL_CAP_MS = 60_000;

export const createSlidingWindowLimiter = ({ limit, windowMs }: SlidingWindowOptions) => {
  const buckets = new Map<string, number[]>();

  const sweep = (): void => {
    const cutoff = Date.now() - windowMs;
    for (const [key, timestamps] of buckets) {
      const fresh = timestamps.filter((timestamp) => timestamp > cutoff);

      if (fresh.length === 0) buckets.delete(key);
      else if (fresh.length !== timestamps.length) buckets.set(key, fresh);
    }
  };

  // unref() keeps this timer from holding the process open — relevant for
  // short-lived serverless invocations, harmless on a long-running server.
  const cleanup = setInterval(sweep, Math.min(windowMs, CLEANUP_INTERVAL_CAP_MS));
  cleanup.unref?.();

  return (key: string, { record = true }: ConsumeOptions = {}): RateLimitResult => {
    const now = Date.now();
    const cutoff = now - windowMs;
    const existing = buckets.get(key) ?? [];
    const fresh = existing.filter((timestamp) => timestamp > cutoff);

    if (fresh.length >= limit) {
      return { success: false, limit, remaining: 0, reset: fresh[0]! + windowMs };
    }

    if (!record) {
      return {
        success: true,
        limit,
        remaining: limit - fresh.length,
        // No attempt stored, so nothing has started counting down yet:
        // with an empty bucket the window would only begin at the first
        // recorded attempt, and `now` is the closest honest answer.
        reset: (fresh[0] ?? now) + windowMs,
      };
    }

    fresh.push(now);
    buckets.set(key, fresh);

    return { success: true, limit, remaining: limit - fresh.length, reset: fresh[0]! + windowMs };
  };
};
