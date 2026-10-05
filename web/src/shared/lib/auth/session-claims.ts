import { z } from "zod";

// Mirrors public.app_role (ADR 0043). Kept here rather than imported
// from the generated database types: proxy.ts and client components both
// read a role, and neither should pull in the whole schema typing for it.
export const APP_ROLES = ["user", "admin"] as const;

export type AppRole = (typeof APP_ROLES)[number];

// The least privileged role, applied whenever the claim is missing or
// unrecognised — a person whose user_roles row was deleted by hand can
// still sign in (the hook returns claims untouched), and must not end up
// with more rights than the database would give them.
export const DEFAULT_APP_ROLE: AppRole = "user";

export type SessionClaims = {
  userId: string;
  role: AppRole;
};

// .catch() alone covers both cases, and .default() is NOT needed beside
// it: a missing key is itself a parse failure, so .catch() swallows it
// the same way it swallows an unrecognised value. (.default() on its own
// would not do — it fills in an absent key but still rejects "root".)
// Measured on zod 4.6.5 rather than assumed, because the redundant pair
// reads as if both were load-bearing.
//
// Treating an unknown role like a missing one is the point: both mean
// "we do not know", and both resolve to the least privileged role rather
// than failing the request.
const claimsSchema = z.object({
  sub: z.string().min(1),
  user_role: z.enum(APP_ROLES).catch(DEFAULT_APP_ROLE),
});

export const parseSessionClaims = (claims: unknown): SessionClaims | null => {
  const result = claimsSchema.safeParse(claims);

  if (!result.success) return null;

  return { userId: result.data.sub, role: result.data.user_role };
};
