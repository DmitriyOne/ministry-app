import "server-only";

import { cookies } from "next/headers";

import { createSupabaseClientWithCookies } from "./create-client-with-cookies";

// Must be created per-request — do not cache/reuse across requests.
export const createServerSupabaseClient = async () => {
  const cookieStore = await cookies();

  return createSupabaseClientWithCookies({
    getAll: () => cookieStore.getAll(),
    setAll: (cookiesToSet) => {
      try {
        for (const { name, value, options } of cookiesToSet) {
          cookieStore.set(name, value, options);
        }
      } catch {
        // Called from a Server Component during rendering — cookies are
        // read-only there, and the cache headers from the second argument
        // cannot be set either. web/proxy.ts does both on every request,
        // which is what keeps the session fresh.
      }
    },
  });
};
