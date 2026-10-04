import "server-only";

// Only meaningful on Vercel (the project's production target, see
// CLAUDE.md). Vercel documents that it rewrites `x-forwarded-for` itself
// and does not forward externally-supplied values — "this restriction is
// in place to prevent IP spoofing" (vercel.com/docs/headers/request-headers).
// `x-vercel-forwarded-for` carries the same value but stays reliable even
// if something in front of the app (a rewrite, an edge middleware, a
// customer-run reverse proxy) also touches `x-forwarded-for` — so it's
// read first. Unlike the AWS/nginx-style "last hop" convention some
// stacks use, Vercel's own docs describe both headers as a single client
// IP, not a hop-by-hop list, so the first (only) entry is taken as-is.
//
// `x-real-ip` is NOT read here (unlike some reference implementations
// copied from nginx-fronted stacks): Vercel never sets it, so trusting it
// would mean trusting a header the client can set to anything — trivially
// defeating the rate limit it's meant to key on.
const FALLBACK_IP = "unknown";

type HeaderReader = Pick<Headers, "get">;

export const getClientIp = (headers: HeaderReader): string => {
  const vercelForwardedFor = headers.get("x-vercel-forwarded-for")?.trim();

  if (vercelForwardedFor) return vercelForwardedFor.split(",")[0]!.trim();

  const forwardedFor = headers.get("x-forwarded-for")?.trim();

  if (forwardedFor) return forwardedFor.split(",")[0]!.trim();

  return FALLBACK_IP;
};
