import "server-only";

import * as Sentry from "@sentry/nextjs";

import { createServerSupabaseClient } from "@/shared/api";
import { parseSessionClaims, type SessionClaims } from "@/shared/lib/auth";
import { reportActionFailure } from "@/shared/lib/action-failure";

// Who is signed in, for Server Components. getClaims(), not getUser()
// (ADR 0044): it verifies the token's signature and expiry locally,
// which is what authorises the request, while getUser() adds a call to
// the auth server on every navigation and only buys detection of a
// session revoked on another device.
//
// `null` means the same thing to the caller whatever caused it — "this
// request has no identity to act on" — and both callers (ProfileScreen,
// AdminNewUserScreen) answer it with redirect(). That is on purpose: a
// screen that reads an identity must not render without one.
//
// But the two causes are not the same thing to US, so they are no longer
// indistinguishable in the log. "no-claims" is the ordinary case, a
// visitor without a session; the other two mean the check itself did not
// work, and a person with a perfectly good session was sent to /login
// (where, their cookie still being valid, the gate sends them on to
// /day — a bounce, not a loop). Without a line in the log that looks
// exactly like signing out by itself.
// Whether the claim is present at all, as opposed to present and
// unreadable — parseSessionClaims deliberately cannot tell the caller
// which, since it answers both with the default role.
const hasRoleClaim = (claims: unknown): boolean =>
  typeof claims === "object" && claims !== null && "user_role" in claims;

// Sent to Sentry once per server instance, and logged every time.
//
// The two destinations answer two different questions. The log answers
// "is it still happening", which is why it repeats: while the hook is off
// EVERY request is affected, and a line that appeared once an hour ago
// would not say whether the fix worked. Sentry answers "does somebody
// know", and for that one event is the whole message — this is a
// deployment-wide misconfiguration, identical on every request, so
// reporting it per request would turn one fact into thousands of events,
// spend the quota that real exceptions need, and bury them.
//
// A module-scoped flag is enough precisely because it is per instance:
// each new Vercel instance says it once, so a deployment that is still
// broken keeps producing a trickle rather than going quiet for ever,
// and one that has been fixed stops as its instances are replaced.
let roleClaimReported = false;

const reportMissingRoleClaim = (userId: string): void => {
  console.warn("[session] token carries no user_role claim", {
    reason: "token-hook-disabled-or-no-role-row",
    userId,
  });

  if (roleClaimReported) return;

  roleClaimReported = true;

  // captureMessage, not captureException: nothing threw, and a synthetic
  // Error here would carry a stack pointing at this line, which says
  // nothing about the cause. `warning` because the app works — it just
  // calls everybody a user. No userId in the Sentry event: it adds
  // nothing to a project-wide setting and it is personal data (ADR 0041).
  Sentry.captureMessage("Access token carries no user_role claim", {
    level: "warning",
    tags: { scope: "session", reason: "token-hook-disabled-or-no-role-row" },
    fingerprint: ["session-missing-user-role-claim"],
  });
};

export const getSessionClaims = async (): Promise<SessionClaims | null> => {
  // Deliberately OUTSIDE the try. Creating the client reads the cookie
  // store, and reading cookies while a route is being prerendered is how
  // Next.js discovers that the route must be dynamic — it signals that by
  // THROWING. Catching it here is what made `pnpm build` print
  // `[session] failed … "Dynamic server usage: Route /profile …"` and send
  // the framework's own control flow to Sentry.
  //
  // Leaving it outside is better than catching it and re-throwing: there
  // is then nothing to recognise and nothing to get wrong. What is left
  // inside the try is one network-ish call that can only fail in ways this
  // function is meant to answer for.
  const supabase = await createServerSupabaseClient();

  try {
    const { data, error } = await supabase.auth.getClaims();

    if (error) {
      console.warn("[session] claims unavailable", {
        reason: "auth-error",
        status: error.status,
      });

      return null;
    }

    const claims = parseSessionClaims(data?.claims ?? null);

    if (!claims) console.info("[session] no claims", { reason: "no-session-or-unreadable" });

    // A token with no `user_role` claim at all. parseSessionClaims treats
    // that as the least privileged role on purpose (ADR 0044) and says
    // nothing about it, which is right for the request and wrong for us:
    // the app then works, looks fine, and calls every single person a
    // `user`, including the owner. There is nothing in the code to find,
    // because the cause is never in the code — it is one of three things
    // outside it:
    //
    //   * the access-token hook is not enabled in that Supabase project
    //     (Authentication → Hooks; it is a project setting, not a
    //     migration — CLAUDE.md lists it under what must be switched on
    //     by hand);
    //   * the person has no row in `user_roles`;
    //   * their row is soft-deleted, which the hook filters out
    //     (`deleted_at is null`, ADR 0047).
    //
    // Found the slow way: a role changed to `admin` in the dashboard,
    // signed out, signed back in, and the profile still said `user`.
    // One line in the log would have answered it in a minute, so here it
    // is. It repeats on every request while the cause stands, which is
    // the correct volume for "nobody in this deployment can be an
    // admin".
    if (claims && !hasRoleClaim(data?.claims)) reportMissingRoleClaim(claims.userId);

    return claims;
  } catch (error) {
    // Verifying a token can reach for the JWKS endpoint, and that can
    // throw rather than answer. Reported like any other unexpected
    // exception, and still answered with null.
    reportActionFailure({ scope: "session", error, outcome: "failed" });

    return null;
  }
};
