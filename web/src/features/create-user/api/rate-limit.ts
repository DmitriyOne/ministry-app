import "server-only";

import { createSlidingWindowLimiter, type RateLimitResult } from "@/shared/lib/rate-limit";

// Ten new accounts an hour per IP. The action is already behind an admin
// check, so this is not the lock — it is the ceiling that keeps a stolen
// admin session, or a script with one, from filling the auth table before
// anyone notices. Ten is far above what issuing credentials by hand looks
// like and far below what an automated loop would want.
const PER_IP_LIMIT = 10;
const PER_IP_WINDOW_MS = 60 * 60 * 1000;

const limiter = createSlidingWindowLimiter({ limit: PER_IP_LIMIT, windowMs: PER_IP_WINDOW_MS });

// The IP is only an in-memory key; it is never logged or stored.
export const checkCreateUserRateLimit = (ip: string): RateLimitResult =>
  limiter(`create-user:ip:${ip}`);
