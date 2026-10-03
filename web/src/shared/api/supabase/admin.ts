import "server-only";

import { createClient } from "@supabase/supabase-js";

import { env } from "@/shared/config";

import type { Database } from "./database.types";

// WARNING: this client holds the secret key and BYPASSES ROW LEVEL SECURITY
// entirely. It may only be imported from server-only modules (server
// actions, route handlers), it must never be re-exported anywhere a Client
// Component can reach, and every call made with it is responsible for its
// own authorisation, because the database will not second-guess it.
// See ADR 0037.
//
// Plain supabase-js, not @supabase/ssr: there is no user session to carry.
export const createAdminSupabaseClient = () =>
  createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
