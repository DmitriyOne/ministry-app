import "server-only";

import { createServerSupabaseClient } from "@/shared/api";
import { parseSessionClaims, type SessionClaims } from "@/shared/lib/auth";

// Who is signed in, for Server Components. getClaims(), not getUser()
// (ADR 0044): it verifies the token's signature and expiry locally,
// which is what authorises the request, while getUser() adds a call to
// the auth server on every navigation and only buys detection of a
// session revoked on another device.
//
// An error is not distinguished from "nobody is signed in" on purpose:
// both mean this request has no identity to act on, and the only place
// that could do anything with the difference is the gate, which would
// send the person to /login either way.
//
// Which is why the try/catch is here and not only in web/proxy.ts. The
// SDK hands most failures back as `error` rather than throwing, so the
// line above covered them — but creating the client reads the cookie
// store, and a verification that cannot reach the JWKS endpoint can
// throw outright. Without this, an outage on a screen that reads the
// session (/profile, the admin screen) would render the 500 screen
// instead of sending the person to /login.
export const getSessionClaims = async (): Promise<SessionClaims | null> => {
  try {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase.auth.getClaims();

    return parseSessionClaims(data?.claims ?? null);
  } catch {
    return null;
  }
};
