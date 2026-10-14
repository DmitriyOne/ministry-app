import "server-only";

import { createTwoTierLimiter, type TwoTierRateLimitResult } from "@/shared/lib/rate-limit";

// A browser registers once, right after the person joins the waitlist and
// presses "enable notifications". A retry after a transient failure or a
// second device on the same network is plausible; more than five an hour
// from one address is a script, not a person.
//
// Each registration also triggers an outbound confirmation push, so a
// burst spread across many IPs would turn this endpoint into a message
// sender. 30/minute covers a spike of genuine signups (a shared link)
// while capping that worst case.
export type PushRegistrationRateLimitResult = TwoTierRateLimitResult;

export const checkPushRegistrationRateLimit = createTwoTierLimiter({
  name: "push-registration",
  perIp: { limit: 5, windowMs: 60 * 60 * 1000 },
  global: { limit: 30, windowMs: 60 * 1000 },
});
