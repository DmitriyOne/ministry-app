import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

/**
 * Typed, validated access to environment variables (via @t3-oss/env-nextjs
 * + zod). Values are read from `process.env` — populated at runtime from
 * `envs/*.local.env` in development, or from the hosting platform's env
 * settings otherwise (see envs/*.example and README.md).
 *
 * Import `env` instead of reading `process.env` directly anywhere else in
 * the app. Validation runs at import time (and is re-asserted at build
 * time via the import in next.config.ts), so a missing/invalid variable
 * fails fast, before any request is handled.
 *
 * `server` keys throw if accessed from client-bundled code — @t3-oss/env
 * enforces this automatically, no manual client/server split needed.
 */
export const env = createEnv({
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.url(),
    // Publishable key (`sb_publishable_...`) — replaces the legacy anon
    // key (Supabase is deprecating `anon`/`service_role` keys; see
    // docs/decisions/0006-*.md). Safe to expose to the browser.
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  },
  emptyStringAsUndefined: true,
});
