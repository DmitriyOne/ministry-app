import "server-only";

import { createSlidingWindowLimiter, type RateLimitResult } from "@/shared/lib/rate-limit";

// Three requests per hour per IP, the same numbers as the waitlist form
// (ADR 0026): one field, one page, and a person who truly needs a reset
// needs it once. Unlike sign-in this counts every accepted submission, not
// just failures — there is no "failure" here, every request is answered
// the same way.
//
// Exceeding it changes nothing a visitor can see: the limiter decides
// whether the request is logged, not what the page says (see
// request-password-reset-action.ts).
const PER_IP_LIMIT = 3;
const PER_IP_WINDOW_MS = 60 * 60 * 1000;

const limiter = createSlidingWindowLimiter({ limit: PER_IP_LIMIT, windowMs: PER_IP_WINDOW_MS });

// The IP is only an in-memory key; it is never logged or stored.
export const checkRequestPasswordResetRateLimit = (ip: string): RateLimitResult =>
  limiter(`request-password-reset:ip:${ip}`);
