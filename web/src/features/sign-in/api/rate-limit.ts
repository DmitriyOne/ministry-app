import "server-only";

import { createSlidingWindowLimiter, type RateLimitResult } from "@/shared/lib/rate-limit";

// Three wrong passwords per quarter of an hour per IP. Sign-in is a
// password check, so the cap is about guessing, and three leaves room for
// a typo and a second thought while being useless for a script walking a
// wordlist.
//
// What counts is the point: only a rejected password does. A successful
// sign-in and a backend that did not answer both leave the budget
// untouched — with a cap this low, counting those would mean a person who
// signs in on two devices, or whose network dropped mid-request, could
// lock themselves out while doing nothing wrong. Hence the check below
// does not record and `recordSignInFailure` is called separately, once the
// answer is known (ADR 0043, update).
const PER_IP_LIMIT = 3;
const PER_IP_WINDOW_MS = 15 * 60 * 1000;

const limiter = createSlidingWindowLimiter({ limit: PER_IP_LIMIT, windowMs: PER_IP_WINDOW_MS });

// The IP is only an in-memory key; it is never logged or stored.
const bucketKey = (ip: string): string => `sign-in:ip:${ip}`;

export const checkSignInRateLimit = (ip: string): RateLimitResult =>
  limiter(bucketKey(ip), { record: false });

export const recordSignInFailure = (ip: string): void => {
  limiter(bucketKey(ip));
};
