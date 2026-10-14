import "server-only";

import { createTwoTierLimiter, type TwoTierRateLimitResult } from "@/shared/lib/rate-limit";

// Numbers picked for what this form actually is: a single email field on
// a pre-launch "coming soon" page, not an active product with recurring
// traffic. A genuine visitor submits once, maybe twice after fixing a
// typo — three per hour per IP leaves headroom for that without being
// useful to a script retrying the same address.
//
// The global cap exists to blunt a burst spread across many IPs (a bot
// farm, a botnet) rather than a single repeat offender; createTwoTierLimiter
// is what guarantees it is checked first. 15/minute comfortably covers a
// plausible spike of genuine interest (e.g. a link shared somewhere) while
// still capping the worst case.
export type JoinWaitlistRateLimitResult = TwoTierRateLimitResult;

export const checkJoinWaitlistRateLimit = createTwoTierLimiter({
  name: "join-waitlist",
  perIp: { limit: 3, windowMs: 60 * 60 * 1000 },
  global: { limit: 15, windowMs: 60 * 1000 },
});
