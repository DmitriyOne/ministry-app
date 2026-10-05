import { routes } from "@/shared/config/routes";

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

type GateInput = {
  pathname: string;
  hasSession: boolean;
};

export type GateDecision = { action: "pass" } | { action: "redirect"; to: string };

// The whole access decision for v2, as a pure function so the redirect
// loop between /login and /day is caught by a test rather than by a
// person stuck in a browser. proxy.ts only reads the cookies and applies
// what this returns.
export const resolveGate = ({ pathname, hasSession }: GateInput): GateDecision => {
  if (SESSION_FORBIDDEN_PATHS.includes(pathname)) {
    return hasSession ? { action: "redirect", to: routes.day } : { action: "pass" };
  }

  if (SESSION_REQUIRED_PATHS.includes(pathname) && !hasSession) {
    return { action: "redirect", to: routes.login };
  }

  return { action: "pass" };
};
