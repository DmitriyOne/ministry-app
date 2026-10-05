import type { AppRole, SessionClaims } from "./session-claims";

// The role guard. In v2 it gates no route at all (ADR 0044) — /profile
// displays the role and nothing branches on it — but it is the one place
// a future check belongs, so it is written and tested now rather than
// improvised later next to the first admin screen.
export const hasRole = (claims: SessionClaims | null, role: AppRole): boolean =>
  claims?.role === role;
