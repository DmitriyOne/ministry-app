import { routes, type AppRoute } from "./routes";

// What each address requires, in one typed map.
//
// Before this module the same question was answered by three separate
// lists that nobody kept in sync: APP_ROUTES in web/proxy.ts (which
// addresses get the device shield), three path arrays in
// shared/lib/auth/resolve-gate.ts (which need a session, which forbid
// one, which need the admin role) and APP_SCREEN_PATHS in
// features/launch-gate (which must be opened from the home-screen icon).
// A new address had to be added to all three, and every list fails
// OPEN — an address missing from APP_ROUTES is not shielded at all.
// That is not a hypothesis: /admin/users/new shipped missing from
// APP_SCREEN_PATHS and opened in an ordinary Safari tab.
//
// `Record<AppRoute, RoutePolicy>` is the fix: a new entry in routes.ts
// does not compile until it has been classified here, and the three
// places that used to keep their own list now ask this map instead.
// What a session means for an address:
//   "any"       — nothing is required, the public side of the app (ADR 0045);
//   "required"  — without a session the gate sends the person to /login;
//   "forbidden" — only makes sense WITHOUT one (/login, /forgot-password):
//                 with a session the gate sends the person into the app.
export type RouteSessionRule = "any" | "required" | "forbidden";

export type RoutePolicy = {
  // Does web/proxy.ts classify the User-Agent for this address (ADR
  // 0016/0017)? False for the /access/* screens themselves — shielding
  // them would redirect a blocked device to the very screen it is
  // already on, forever — and for anything the proxy deliberately
  // leaves alone so that a wrong address gives a real 404.
  deviceShield: boolean;
  session: RouteSessionRule;
  // Needs the admin role on top of a session (ADR 0044). A signed-in
  // non-admin is sent to /profile, not /login: they are authenticated,
  // and /login would bounce them straight back by its own rule.
  adminOnly?: true;
  // Must be launched from the home-screen icon, or LaunchGate sends the
  // person to /install (ADR 0017/0019/0028). Only the client can see
  // display-mode, so this flag is read there, not in the proxy.
  launchGate: boolean;
};

const PUBLIC_PAGE: RoutePolicy = { deviceShield: true, session: "any", launchGate: false };
const APP_SCREEN: RoutePolicy = { deviceShield: true, session: "required", launchGate: true };
// The device shield is off: these ARE the screens a blocked device is
// sent to.
const BLOCKED_SCREEN: RoutePolicy = { deviceShield: false, session: "any", launchGate: false };
// Outside production only (isDebugPageEnabled), and gating them would
// defeat what they exist for.
const DEBUG_PAGE: RoutePolicy = { deviceShield: false, session: "any", launchGate: false };

export const ROUTE_POLICY: Record<AppRoute, RoutePolicy> = {
  // "/" redirects to /day, so it carries the same requirements.
  [routes.root]: APP_SCREEN,
  [routes.day]: APP_SCREEN,
  [routes.calendar]: APP_SCREEN,
  [routes.month]: APP_SCREEN,
  [routes.year]: APP_SCREEN,
  [routes.profile]: APP_SCREEN,
  // Reached from the profile, and it marks itself read against the
  // signed-in person's row — so it needs a session, unlike /about and
  // /privacy, which anyone may read from the footer before signing in.
  [routes.whatsNew]: APP_SCREEN,
  [routes.adminNewUser]: { ...APP_SCREEN, adminOnly: true },
  // Reachable only without a session, but still only from the installed
  // app: signing in happens inside the app, not in a browser tab.
  [routes.login]: { deviceShield: true, session: "forbidden", launchGate: true },
  [routes.forgotPassword]: { deviceShield: true, session: "forbidden", launchGate: true },
  // The public side: a landing page, the install instructions and the two
  // documents. All four open in an ordinary tab, with or without a
  // session (ADR 0029/0031/0045).
  [routes.soon]: PUBLIC_PAGE,
  [routes.install]: PUBLIC_PAGE,
  [routes.about]: PUBLIC_PAGE,
  [routes.privacy]: PUBLIC_PAGE,
  [routes.accessDesktop]: BLOCKED_SCREEN,
  [routes.accessAndroid]: BLOCKED_SCREEN,
  [routes.accessIosBrowser]: BLOCKED_SCREEN,
  [routes.sentryExampleError]: DEBUG_PAGE,
  [routes.sentryExampleErrorServer]: DEBUG_PAGE,
};

// Everything under /admin is admin-only even when it is not in the map
// above. The map fails closed for the one family where a missing entry
// would be worst: a screen added under /admin before its route constant
// exists (a dynamic segment, say /admin/users/[id]) is shielded from the
// first request rather than from the commit that remembers to list it.
const ADMIN_FAMILY_PREFIX = "/admin";

const ADMIN_FAMILY_POLICY: RoutePolicy = { ...APP_SCREEN, adminOnly: true };

// The same reasoning for the day's own family. Every /day carries its
// date — /day/2026-06-02 — and the bare /day only redirects to today
// (ADR 0063), so without this line the screen a person actually uses
// would have NO policy at all: the proxy leaves an unclassified address
// alone by design, which here means no device shield, no session and no
// home-screen icon. Measured before writing it, not guessed.
//
// `routes.day` is the prefix, so there is nothing new to keep in step:
// the family and the address it belongs to are the same string.

// null means "not one of this app's addresses": the proxy leaves it
// alone, so /qwerty gives a real 404 instead of a device placeholder.
export const resolveRoutePolicy = (pathname: string): RoutePolicy | null => {
  // Object.hasOwn, not a plain lookup: `ROUTE_POLICY["constructor"]` would
  // hand back Object's constructor, and a function is truthy — a "policy"
  // whose every field is undefined, which reads as "no shield, no session
  // needed". Today no pathname can reach it (they all start with "/", and
  // no inherited key does), so this is not a bug being fixed; it is a
  // guard that does not depend on that still being true.
  if (Object.hasOwn(ROUTE_POLICY, pathname)) return ROUTE_POLICY[pathname as AppRoute];

  if (pathname === ADMIN_FAMILY_PREFIX || pathname.startsWith(`${ADMIN_FAMILY_PREFIX}/`)) {
    return ADMIN_FAMILY_POLICY;
  }

  // A trailing slash is required, so /dayz and /day-summary stay
  // unclassified — the same rule the navigation's active state follows,
  // and for the same reason: a prefix without the separator is not a
  // family, it is a coincidence of spelling.
  if (pathname.startsWith(`${routes.day}/`)) return APP_SCREEN;

  // And the month's family, for exactly the same reason: the month lives
  // in the address too (/month/2026-06, ADR 0066), so without this line
  // the screen a person opens from the navigation would be
  // unclassified — no device shield, no session, no home-screen icon.
  if (pathname.startsWith(`${routes.month}/`)) return APP_SCREEN;

  // And the service year's, third of the three for the third time
  // (/year/2026, ADR 0067). Writing it out again rather than folding the
  // three into a loop over prefixes: the list would then be the thing to
  // read, and what matters about each of these lines is the screen it
  // keeps behind a session — a fourth screen with a segment in its
  // address should have to say so here on purpose.
  if (pathname.startsWith(`${routes.year}/`)) return APP_SCREEN;

  return null;
};
