import "server-only";

import { createSlidingWindowLimiter, type RateLimitResult } from "@/shared/lib/rate-limit";

// A limiter of its own, NOT the waitlist one next door, and the reason is
// a bug this nearly shipped with.
//
// checkPushRegistrationRateLimit allows five calls an hour per address and
// thirty a minute globally. Both numbers were chosen for a path that is
// reached once, right after joining the waitlist, and that sends a
// confirmation push on every call. This path is reached every time the
// profile screen opens — it is a tab in the bottom navigation — so a
// person could exhaust five opens in a minute and then find the switch
// answering "couldn't save that". Worse, the global thirty is shared: a
// few people looking at their profile could have blocked waitlist
// registrations.
//
// What this path actually is: session-gated, sends nothing, and writes
// one idempotent row. So it is capped per address only, high enough that
// a person cannot reach it by using the app and low enough that a stolen
// session cannot churn the table.
const PER_IP_LIMIT = 20;
const PER_IP_WINDOW_MS = 60 * 60 * 1000;

const limiter = createSlidingWindowLimiter({ limit: PER_IP_LIMIT, windowMs: PER_IP_WINDOW_MS });

export const checkUserPushRateLimit = (ip: string): RateLimitResult =>
  limiter(`user-push:ip:${ip}`);
