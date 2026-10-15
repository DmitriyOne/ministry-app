import "server-only";

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

    return claims;
  } catch (error) {
    // Verifying a token can reach for the JWKS endpoint, and that can
    // throw rather than answer. Reported like any other unexpected
    // exception, and still answered with null.
    reportActionFailure({ scope: "session", error, outcome: "failed" });

    return null;
  }
};
