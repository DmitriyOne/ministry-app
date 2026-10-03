import type { NextConfig } from "next";
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
};

// The next-intl config path is also relative, for the same reason as
// env.ts above (next.config.ts sits outside the bundler's module graph).
const withNextIntl = createNextIntlPlugin("./src/shared/config/i18n/request.ts");

export default withNextIntl(withSerwist(nextConfig));
