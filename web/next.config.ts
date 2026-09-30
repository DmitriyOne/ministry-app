import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";
import createNextIntlPlugin from "next-intl/plugin";

// Validates env vars at build time (throws before the build proceeds if
// something required is missing/invalid) and supplies DEV_ALLOWED_ORIGIN
// below — see src/shared/config/env.ts. Relative import: next.config.ts
// is loaded outside of the webpack/turbopack module graph, so the "@/*"
// tsconfig path alias isn't resolved here.
import { env } from "./src/shared/config/env";

const nextConfig: NextConfig = {
  /* config options here */
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
