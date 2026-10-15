import { resolveRoutePolicy } from "@/shared/config/route-policy";
import { routes } from "@/shared/config/routes";
import type { AppRole } from "./session-claims";

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
//
// WHICH address requires what is not decided here any more: that is
// ROUTE_POLICY in shared/config (one typed map, so a new route does not
// compile until it is classified). This function decides what to DO about
// it, and nothing it returns may point at an address whose own rule sends
// the person back — the tests cover every combination for exactly that.
export const resolveGate = ({ pathname, hasSession, role }: GateInput): GateDecision => {
  const policy = resolveRoutePolicy(pathname);

  // Not one of this app's addresses: not the gate's business (a real 404
  // beats a redirect here).
  if (!policy) return { action: "pass" };

  if (policy.session === "forbidden") {
    return hasSession ? { action: "redirect", to: routes.day } : { action: "pass" };
  }

  if (policy.session === "required" && !hasSession) {
    return { action: "redirect", to: routes.login };
  }

  // Checked after the session, so someone who is not signed in at all
  // goes to /login rather than to a screen that would bounce them.
  if (policy.adminOnly && role !== "admin") {
    return { action: "redirect", to: routes.profile };
  }

  return { action: "pass" };
};
