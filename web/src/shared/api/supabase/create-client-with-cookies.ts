import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";

import { env } from "@/shared/config";

import type { Database } from "./database.types";

// One place for the URL, the publishable key and the Database generic, so
// the two server-side call sites cannot drift apart. They differ only in
// where the session cookies live, which is what the name says and what
// each caller passes in:
//
//   server.ts  — cookies from next/headers, for Server Components,
//                Server Actions and Route Handlers;
//   web/proxy.ts — cookies from the NextRequest, because next/headers is
//                not available there.
//
// Supabase's own Next.js example keeps these as two separate clients for
// the same reason, but repeats the URL and the key in both. Here they are
// written once: a divergence in the key — or in anything that affects the
// auth cookie's name — would not fail loudly, it would quietly give the
// two sides different sessions (the trap ADR 0009 already recorded for
// the cookie name).
//
// Deliberately NOT marked `import "server-only"`: web/proxy.ts imports
// this module, and proxy runs in its own server context rather than the
// RSC one that `server-only` is written for. The guard stays where the
// risk is — admin.ts (the secret key) and server.ts (next/headers).
export const createSupabaseClientWithCookies = (cookies: CookieMethodsServer) =>
  createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookies },
  );
