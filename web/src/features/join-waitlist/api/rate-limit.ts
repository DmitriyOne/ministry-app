import "server-only";

import { createSlidingWindowLimiter, type RateLimitResult } from "@/shared/lib/rate-limit";

// Numbers picked for what this form actually is: a single email field on
// a pre-launch "coming soon" page, not an active product with recurring
// traffic. A genuine visitor submits once, maybe twice after fixing a
// typo — three per hour per IP leaves headroom for that without being
// useful to a script retrying the same address.
const PER_IP_LIMIT = 3;
const PER_IP_WINDOW_MS = 60 * 60 * 1000;

// The global cap exists to blunt a burst spread across many IPs (a bot
// farm, a botnet) rather than a single repeat offender — checked first so
// that kind of burst is throttled before it fans out across many
// per-IP buckets. 15/minute comfortably covers a plausible spike of
// genuine interest (e.g. a link shared somewhere) while still capping the
// worst case.
const GLOBAL_LIMIT = 15;
const GLOBAL_WINDOW_MS = 60 * 1000;
const GLOBAL_KEY = "join-waitlist:global";

const perIpLimiter = createSlidingWindowLimiter({ limit: PER_IP_LIMIT, windowMs: PER_IP_WINDOW_MS });
const globalLimiter = createSlidingWindowLimiter({ limit: GLOBAL_LIMIT, windowMs: GLOBAL_WINDOW_MS });

export type JoinWaitlistRateLimitScope = "ip" | "global";

export type JoinWaitlistRateLimitResult = RateLimitResult & {
  scope: JoinWaitlistRateLimitScope;
};

export const checkJoinWaitlistRateLimit = (ip: string): JoinWaitlistRateLimitResult => {
  const global = globalLimiter(GLOBAL_KEY);

  if (!global.success) return { scope: "global", ...global };

  const perIp = perIpLimiter(`join-waitlist:ip:${ip}`);

  return { scope: "ip", ...perIp };
};
