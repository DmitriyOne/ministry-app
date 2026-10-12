import type { AppRole, SessionClaims } from "./session-claims";

// The role guard. Written as a type predicate, not a plain boolean: the
// callers that act on a role need the claims afterwards (the user id, to
// re-read the role from the database), and `claims?.role === role` is
// already proof that `claims` is there. Without the predicate every such
// caller repeats a null check the compiler cannot see through, or reaches
// for a non-null assertion.
export const hasRole = (claims: SessionClaims | null, role: AppRole): claims is SessionClaims =>
  claims?.role === role;
