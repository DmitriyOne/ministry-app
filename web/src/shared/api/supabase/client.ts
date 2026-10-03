import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/shared/config";

import type { Database } from "./database.types";

// Public URL + publishable key only — never pass a secret/service role key here.
// The Database generic is what makes .from()/.rpc() checked against the
// generated types (database.types.ts) instead of falling back to `any`.
export const createBrowserSupabaseClient = () => {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
};
