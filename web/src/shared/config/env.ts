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
