import { routes } from "@/shared/config/routes";
import type { AppRole } from "./session-claims";

// Paths that need a session. /soon, /install, /about and /privacy are
// deliberately absent: they are the public side of the app (ADR 0045).
const SESSION_REQUIRED_PATHS: string[] = [
  routes.root,
  routes.day,
  routes.calendar,
  routes.month,
  routes.year,
  routes.profile,
];

// Paths that only make sense without a session. A signed-in person
// landing here goes to the app instead — and nothing in this table may
// point back at a path in it, or the two redirects form a loop.
const SESSION_FORBIDDEN_PATHS: string[] = [routes.login, routes.forgotPassword];

// Paths only an admin may open. The role travels in the token (ADR
// 0044), so the proxy can decide this without a round trip — and until
// now nothing in v2 branched on a role at all. A signed-in person who is
// not an admin is sent to /profile rather than /login: they are not
// unauthenticated, they simply have no business here, and /login would
// bounce them straight back with its own rule.
const ADMIN_PATHS: string[] = [routes.adminNewUser];

type GateInput = {
  pathname: string;
  hasSession: boolean;
  // Absent when there is no session, and when the claims could not be
  // read — both mean "no role", which is never enough for an admin path.
  role?: AppRole;
};

export type GateDecision = { action: "pass" } | { action: "redirect"; to: string };

// The whole access decision for v2, as a pure function so the redirect
// loop between /login and /day is caught by a test rather than by a
// person stuck in a browser. proxy.ts only reads the cookies and applies
// what this returns.
export const resolveGate = ({ pathname, hasSession, role }: GateInput): GateDecision => {
  if (SESSION_FORBIDDEN_PATHS.includes(pathname)) {
    return hasSession ? { action: "redirect", to: routes.day } : { action: "pass" };
  }

  if (ADMIN_PATHS.includes(pathname)) {
    if (!hasSession) return { action: "redirect", to: routes.login };

    return role === "admin" ? { action: "pass" } : { action: "redirect", to: routes.profile };
  }

  if (SESSION_REQUIRED_PATHS.includes(pathname) && !hasSession) {
    return { action: "redirect", to: routes.login };
  }

  return { action: "pass" };
};
