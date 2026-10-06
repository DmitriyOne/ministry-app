import "server-only";

import { createSlidingWindowLimiter, type RateLimitResult } from "@/shared/lib/rate-limit";

// Sign-in is a password check, so the cap is about guessing, not about
// spam: ten tries per quarter of an hour per IP leaves room for a person
// fumbling a password, and is useless for a script walking a wordlist.
const PER_IP_LIMIT = 10;
const PER_IP_WINDOW_MS = 15 * 60 * 1000;

const limiter = createSlidingWindowLimiter({ limit: PER_IP_LIMIT, windowMs: PER_IP_WINDOW_MS });

// The IP is only an in-memory key; it is never logged or stored.
export const checkSignInRateLimit = (ip: string): RateLimitResult => limiter(`sign-in:ip:${ip}`);
