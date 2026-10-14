import "server-only";

import { createSlidingWindowLimiter, type RateLimitResult } from "./sliding-window";

export type RateLimitScope = "ip" | "global";

export type TwoTierRateLimitResult = RateLimitResult & {
  scope: RateLimitScope;
};

type TwoTierLimiterOptions = {
  // Prefixes both bucket keys, so two features never share a bucket.
  name: string;
  perIp: { limit: number; windowMs: number };
  global: { limit: number; windowMs: number };
};

// A global cap in front of a per-IP cap — the shape every public form in
// this project needs, previously copied per feature (ADR 0026).
//
// The order is the point, and it is why this is one function rather than
// a convention each caller re-implements: the global bucket is checked
// FIRST, so a burst spread across many addresses is throttled before it
// fans out into many per-IP buckets that each look innocent. A copy that
// got the order backwards would still pass its own tests and quietly do
// nothing against the case the global cap exists for.
//
// What this does NOT give you is a real cap: the counters live in the
// memory of one serverless instance and the key is an IP address. See ADR
// 0026, update 2026-10-14, before relying on it for anything.
export const createTwoTierLimiter = (
  { name, perIp, global }: TwoTierLimiterOptions,
): ((ip: string) => TwoTierRateLimitResult) => {
  const perIpLimiter = createSlidingWindowLimiter(perIp);
  const globalLimiter = createSlidingWindowLimiter(global);
  const globalKey = `${name}:global`;

  return (ip: string): TwoTierRateLimitResult => {
    const globalResult = globalLimiter(globalKey);

    if (!globalResult.success) return { scope: "global", ...globalResult };

    return { scope: "ip", ...perIpLimiter(`${name}:ip:${ip}`) };
  };
};
