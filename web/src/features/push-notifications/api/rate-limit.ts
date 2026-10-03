import "server-only";

import { createSlidingWindowLimiter, type RateLimitResult } from "@/shared/lib/rate-limit";

// A browser registers once, right after the person joins the waitlist and
// presses "enable notifications". A retry after a transient failure or a
// second device on the same network is plausible; more than five an hour
// from one address is a script, not a person.
const PER_IP_LIMIT = 5;
const PER_IP_WINDOW_MS = 60 * 60 * 1000;

// Each registration also triggers an outbound confirmation push, so a
// burst spread across many IPs would turn this endpoint into a message
// sender. 30/minute covers a spike of genuine signups (a shared link)
// while capping that worst case. Checked first, as in join-waitlist.
const GLOBAL_LIMIT = 30;
const GLOBAL_WINDOW_MS = 60 * 1000;
const GLOBAL_KEY = "push-registration:global";

const perIpLimiter = createSlidingWindowLimiter({ limit: PER_IP_LIMIT, windowMs: PER_IP_WINDOW_MS });
const globalLimiter = createSlidingWindowLimiter({ limit: GLOBAL_LIMIT, windowMs: GLOBAL_WINDOW_MS });

export type PushRegistrationRateLimitScope = "ip" | "global";

export type PushRegistrationRateLimitResult = RateLimitResult & {
  scope: PushRegistrationRateLimitScope;
};

export const checkPushRegistrationRateLimit = (ip: string): PushRegistrationRateLimitResult => {
  const global = globalLimiter(GLOBAL_KEY);

  if (!global.success) return { scope: "global", ...global };

  const perIp = perIpLimiter(`push-registration:ip:${ip}`);

  return { scope: "ip", ...perIp };
};
