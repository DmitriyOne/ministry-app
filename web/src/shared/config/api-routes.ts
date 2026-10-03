// Absolute-path constants for the HTTP endpoints the app talks to —
// written down once, like the page paths in ./routes.ts.
//
// They live in config rather than shared/api on purpose: shared/api's
// public API also exports the server-side Supabase client, which imports
// next/headers, and a Client Component reaching for one of these
// constants used to drag that client into the browser bundle with it.
// Constants have no runtime environment; clients do.

const WEB_API_PREFIX = "/api";
const WEB_API_VERSION = "/v1";

// This app's own Route Handlers (web/app/api/**).
export const WEB_API_ROUTES = {
  health: `${WEB_API_PREFIX}${WEB_API_VERSION}/health`,
} as const;

// Edge Functions live under /functions/v1/<name>. `/rest/v1` is PostgREST's
// prefix and has no business in a function path: concatenating all three
// produced "/functions/rest/v1/v1/health", which 404s, so the health check on
// /day reported Supabase unreachable every time.
const SB_FUNCTIONS_PREFIX = "/functions/v1";

// Supabase endpoints, appended to NEXT_PUBLIC_SUPABASE_URL by the caller.
export const SB_API_ROUTES = {
  functions: {
    health: `${SB_FUNCTIONS_PREFIX}/health`,
  },
} as const;
