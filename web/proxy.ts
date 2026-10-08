import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Imported by its own path, not through the shared/api barrel: that
// barrel also re-exports admin.ts, the client that holds the secret key
// and bypasses RLS (ADR 0037 keeps its use to a single module, and ADR
// 0034 calls the mixed-runtime barrel a deliberate trap). The proxy has
// no business carrying that client, so it takes only the factory.
import { createSupabaseClientWithCookies } from "@/shared/api/supabase/create-client-with-cookies";
import { classifyAccess } from "@/shared/lib/access";
import { parseSessionClaims, resolveGate } from "@/shared/lib/auth";
import { env, routes } from "@/shared/config";

// redirect, not rewrite — the address bar DOES change (ADR 0017's
// "Обновление: redirect вместо rewrite для /access/*" explains why a
// silent rewrite broke LaunchGate, which decides purely off
// window.location.pathname).
const BLOCKED_SCREEN_PATH: Record<"desktop" | "android" | "ios-not-safari", string> = {
  "desktop": routes.accessDesktop,
  "android": routes.accessAndroid,
  "ios-not-safari": routes.accessIosBrowser,
};

// Only these paths go through classification — otherwise non-existent
// addresses would get a device placeholder instead of a real 404.
// "/about" and "/privacy" are both in the list (device shield applies —
// desktop/Android still get a placeholder) but deliberately NOT in
// LaunchGate's APP_SCREEN_PATHS (features/launch-gate/model/
// use-launch-gate.ts): both open in an ordinary Safari tab, not only
// from the home-screen icon — see ADR 0029 (about) and ADR 0031
// (privacy). All paths come from shared/config/routes.ts (ADR 0030) —
// the single place these literals are written down.
const APP_ROUTES: string[] = [
  routes.root,
  routes.day,
  routes.soon,
  routes.install,
  routes.about,
  routes.privacy,
  routes.login,
  routes.forgotPassword,
  routes.calendar,
  routes.month,
  routes.year,
  routes.profile,
  routes.adminNewUser,
];

// The server can't see display-mode (standalone/fullscreen) — that check
// is done by LaunchGate on the client (ADR 0017/0019/0028). What the server
// decides is the device class and, for v2, whether there is a session.
//
// The order of the checks below is load-bearing:
//   1. DEV_MODE bypasses everything;
//   2. paths outside APP_ROUTES are left alone, so /qwerty is a real 404;
//   3. the device shield runs before the session is even read, so a
//      desktop visitor never reaches /login;
//   4. only then does the session decide (resolveGate).
export const proxy = async (request: NextRequest) => {
  if (env.DEV_MODE) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (!APP_ROUTES.includes(pathname)) return NextResponse.next();

  const access = classifyAccess(request.headers.get("user-agent") ?? "");
  if (access !== "ios-safari") {
    const url = request.nextUrl.clone();
    url.pathname = BLOCKED_SCREEN_PATH[access];
    // 307 Temporary Redirect, not 308/permanent: the device class is
    // derived from the User-Agent header on THIS request, not a durable
    // property of the URL — the same person can open /day from a
    // computer today and an iPhone tomorrow. A permanent redirect
    // invites browsers/shared caches to remember "/day → /access/desktop"
    // and keep applying it regardless of who asks next, which would lock
    // that visitor out of the app on a phone too. 307 also preserves the
    // request method (unlike 302's historically inconsistent handling),
    // though every request through this proxy is a GET in practice.
    return NextResponse.redirect(url, 307);
  }

  // Cookies come from the request here, not from next/headers, so this
  // client is built inline instead of through shared/api/supabase/server.
  // Refreshed session cookies are written both onto the request (so the
  // rest of this render sees them) and onto the response.
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createSupabaseClientWithCookies({
    getAll: () => request.cookies.getAll(),
    setAll: (cookiesToSet, headers) => {
      for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
      supabaseResponse = NextResponse.next({ request });
      for (const { name, value, options } of cookiesToSet) {
        supabaseResponse.cookies.set(name, value, options);
      }
      // The second argument is part of the documented setAll contract:
      // Cache-Control, Expires and Pragma, which must be applied so a CDN
      // or reverse proxy never caches a response carrying Set-Cookie —
      // otherwise one person's session token can be served to another.
      for (const [key, value] of Object.entries(headers)) {
        supabaseResponse.headers.set(key, value);
      }
    },
  });

  // getClaims(), not getUser() (ADR 0044): local signature and expiry
  // check. Any failure counts as "no session" — the gate would send the
  // person to /login either way.
  let claims = null;
  try {
    const { data } = await supabase.auth.getClaims();
    claims = parseSessionClaims(data?.claims ?? null);
  } catch {
    claims = null;
  }

  // The role comes out of the same verified token, so an admin path costs
  // no extra round trip (ADR 0044). Unreadable claims mean no session and
  // no role, which the gate treats as "not an admin" either way.
  const decision = resolveGate({
    pathname,
    hasSession: claims !== null,
    role: claims?.role,
  });
  if (decision.action === "pass") return supabaseResponse;

  const url = request.nextUrl.clone();
  url.pathname = decision.to;
  url.search = "";
  // The refreshed session cookies must travel on the redirect too, or a
  // person whose token was just refreshed would be signed out by the very
  // redirect that follows. 307 for the same reason as above.
  const redirectResponse = NextResponse.redirect(url, 307);
  for (const cookie of supabaseResponse.cookies.getAll()) {
    redirectResponse.cookies.set(cookie);
  }
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = supabaseResponse.headers.get(header);
    if (value) redirectResponse.headers.set(header, value);
  }
  return redirectResponse;
};

// "monitoring" is Sentry's tunnel route (next.config.ts). The proxy already
// ignores every path outside APP_ROUTES, but that is a side effect; Sentry's
// docs require excluding the route explicitly when building with Turbopack.
// The tunnel is currently switched off (ADR 0041, update), so this entry
// guards nothing today — it is kept so that turning the tunnel back on does
// not silently reintroduce the interception it was written to prevent.
// Assets don't need classification — running them through proxy would
// only slow down serving them.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|serwist|favicon.ico|manifest.webmanifest|icons|pwa|monitoring).*)",
  ],
};
