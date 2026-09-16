import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/shared/config";

// Public URL + publishable key only — never pass a secret/service role key here.
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
