import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    // Disables the "iPhone Safari only" shield (web/proxy.ts, ADR 0016/0017)
    // for local development. Defaults to false — the shield stays active.
    // Server-only: proxy.ts reads it directly, the client never needs it.
    DEV_MODE: z.stringbool().default(false),
    // A developer's own LAN IP(s) (e.g. 192.168.1.x), added to Next.js's
    // dev server origin allowlist so the dev server can be opened from a
    // phone on the same network — see next.config.ts's `allowedDevOrigins`.
    // Comma-separated when there's more than one network (e.g. a home
    // Wi-Fi and a mobile hotspot) — split, trimmed, empty entries dropped
    // below. Not set — the default — means no extra origin is allowed;
    // this is a per-machine value (the address changes with the network)
    // and must never be hardcoded or committed, see envs/web.local.env.example.
    DEV_ALLOWED_ORIGIN: z
      .string()
      .optional()
      .transform((value) =>
        value
          ?.split(",")
          .map((origin) => origin.trim())
          .filter((origin) => origin.length > 0),
      ),
    // Explicit override for the absolute base URL metadata needs
    // (robots.txt's Sitemap: line, sitemap.xml's per-page url,
    // metadataBase — ADR 0032). Optional and unset by default: the
    // production domain hasn't been confirmed yet, so nothing is baked
    // in here — see getSiteUrl() below for the fallback chain, used by
    // every caller instead of this field directly.
    SITE_URL: z.url().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    // Publishable key — replaces the legacy anon key, see docs/decisions/0006-*.md.
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
});

// DEV_MODE=true in production opens the app up to every device — the
// shield stops blocking anything. A warning in the logs isn't enough
// (nobody watches boot logs on Vercel) — fail the startup outright so the
// dangerous combination can't reach production silently.
//
// Guarded by `typeof window === "undefined"`: this module is exported
// from the shared/config barrel alongside `locale`, so any Client
// Component that only needs `locale` (e.g. pages/server-error) still
// pulls this whole module into the client bundle through the barrel.
// `env.DEV_MODE` is a server-only key — createEnv() throws the moment a
// *client* bundle reads it, guard or no guard, so the short-circuit here
// must stop the read itself from ever happening in the browser, not just
// the throw that would follow it.
if (typeof window === "undefined" && env.DEV_MODE && process.env.NODE_ENV === "production") {
  throw new Error(
    "[env] DEV_MODE=true together with NODE_ENV=production disables the " +
      "\"phones only\" shield for ALL visitors — refusing to start. Remove " +
      "DEV_MODE from the Production environment on Vercel (it's for local " +
      "development only, alongside NODE_ENV=development).",
  );
}

// Absolute base URL for metadata fields that must be fully qualified —
// robots.txt's Sitemap: line, sitemap.xml's per-page url, and
// metadataBase in the root layout (see shared/lib/seo, ADR 0032).
// SITE_URL is the explicit override, set once the production domain is
// confirmed (envs/*.local.env or a Vercel project env var) — never
// hardcoded here. VERCEL_PROJECT_PRODUCTION_URL is Vercel's own
// platform-injected variable (present on every Vercel build without a
// protocol, naming the project's confirmed production domain) used as a
// fallback so nothing needs setting by hand once the project is linked.
// Read directly from process.env, not through createEnv/zod — it's
// supplied by the platform, not a value this project defines.
// Neither present (local dev, or any build before the domain is
// confirmed/linked) — undefined, and every caller degrades safely
// rather than crashing (empty sitemap, a robots.txt with no Sitemap:
// line, no metadataBase).
//
// A function, not a module-scope constant: env.SITE_URL is a
// server-only key (same reasoning as the DEV_MODE guard above) — a
// client bundle pulling in this module through the shared/config
// barrel must never evaluate it.
export const getSiteUrl = (): string | undefined => {
  if (typeof window !== "undefined") return undefined;

  return (
    env.SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : undefined)
  );
};
