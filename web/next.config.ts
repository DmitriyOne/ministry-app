import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs/config";
import { withSerwist } from "@serwist/turbopack";
import createNextIntlPlugin from "next-intl/plugin";

// Validates env vars at build time (throws before the build proceeds if
// something required is missing/invalid) and supplies DEV_ALLOWED_ORIGIN
// below — see src/shared/config/env.ts. Relative import: next.config.ts
// is loaded outside of the webpack/turbopack module graph, so the "@/*"
// tsconfig path alias isn't resolved here.
import { env } from "./src/shared/config/env";

// Version-skew protection (ADR 0036). After a deploy, a browser that still
// has the previous build open carries its own id; when the server sees a
// different one it answers with a full page reload instead of letting the
// request fail. Without this the stale page's Server Action id no longer
// exists on the server and the submission fails for good — the person
// retries, it keeps failing, and their email is lost until they relaunch
// the app.
//
// The value is the commit the build came from: it changes with every
// deploy, is identical across all instances of that deploy, and Vercel
// supplies it without any configuration. Trimmed to 12 characters because
// a deployment id may be at most 32. Unset off Vercel (local builds), and
// then Next.js falls back to its own generated build id.
const deploymentId = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12);

// Security headers. Until now the app answered with none of them at all:
// nothing in next.config.ts, no vercel.json, and proxy.ts only carries the
// session cookie across a redirect. Found during the release review.
//
// What is deliberately NOT here: a full Content-Security-Policy with a
// script-src. Next.js injects inline bootstrap scripts, so a real policy
// needs a per-request nonce threaded through proxy.ts, and a mistake there
// fails silently — a blank screen on someone's phone with nothing in the
// logs. The directives below are the part of CSP that costs nothing to get
// right: none of them can break a script that was already loading.
//
// `frame-ancestors 'none'` is the modern spelling of X-Frame-Options, which
// is kept alongside it because older WebViews only understand the latter.
// `form-action 'self'` matters more than it looks here: every form in this
// app posts to a Server Action on the same origin, so there is no case
// where a wider value would be correct.
const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
  },
  // The app asks for none of these. Push notifications do not go through
  // the Permissions-Policy mechanism, so denying everything here costs
  // nothing today and makes a future feature announce itself by failing
  // instead of quietly getting the permission.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  // Vercel already sends HSTS on its own domains; this makes it a property
  // of the application rather than of where it happens to be deployed.
  // Without `preload` and without `includeSubDomains` on purpose: both are
  // effectively one-way doors (a preload entry is slow to undo, and
  // includeSubDomains would break any subdomain that is ever served over
  // plain HTTP), and that is the owner's call, not a build setting.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
] as const;

const nextConfig: NextConfig = {
  /* config options here */
  ...(deploymentId ? { deploymentId } : {}),
  // A developer's own LAN IP(s) (envs/*.local.env, DEV_ALLOWED_ORIGIN,
  // comma-separated for more than one network) so the dev server can be
  // opened from a phone on the same network. Left unset in git — see
  // envs/web.local.env.example — so no restriction is added when nobody
  // has configured it.
  allowedDevOrigins:
    env.DEV_ALLOWED_ORIGIN && env.DEV_ALLOWED_ORIGIN.length > 0 ? env.DEV_ALLOWED_ORIGIN : undefined,
  headers: async () => [
    {
      // Everything, including the service worker and the static files: a
      // header that only covers pages leaves the rest answering as before.
      source: "/(.*)",
      headers: [...SECURITY_HEADERS],
    },
  ],
};

// The next-intl config path is also relative, for the same reason as
// env.ts above (next.config.ts sits outside the bundler's module graph).
const withNextIntl = createNextIntlPlugin("./src/shared/config/i18n/request.ts");

// Sentry is the outermost wrapper (ADR 0041). Organisation, project and
// token are read straight from process.env, like VERCEL_GIT_COMMIT_SHA
// above: they are build-time values, not runtime configuration.
export default withSentryConfig(withNextIntl(withSerwist(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  // A fixed string, not `true`. Sentry's docs warn that with Turbopack the
  // auto-generated route breaks client delivery if middleware intercepts
  // it, and this project builds with Turbopack and has a proxy.ts.
  // The route is excluded in proxy.ts and never cached in sw.ts.
  //
  // TURNED OFF by the owner (ADR 0041, update): the tunnel adds a route of
  // our own that every client event passes through, and in development it
  // was a source of load and of the MaxListenersExceededWarning from Next's
  // compression layer. The cost of leaving it off is real and worth
  // knowing: without the tunnel, client events go straight to Sentry's
  // ingest domain, which content blockers can block — so some browser-side
  // errors will simply never arrive. Server-side events are unaffected.
  // tunnelRoute: "/monitoring",
  silent: !process.env.CI,
  // Drops Sentry's debug logger from the client bundle. SDK v11 replaced
  // the old top-level `disableLogger` with this webpack-scoped option; it
  // has no effect under Turbopack, so it only matters if the project ever
  // builds with webpack.
  webpack: { treeshake: { removeDebugLogging: true } },
});
