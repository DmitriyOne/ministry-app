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

// SB_API_ROUTES used to live here, holding the path of the Supabase Edge
// Function `health`. Its only consumer was /day's scaffold probe, removed
// with the screen's rewrite, so the constant went with it rather than
// staying as a path nobody requests. The function itself is still
// deployed (backend/supabase/functions/health).
//
// Worth keeping from it, in case something calls an Edge Function again:
// they live under "/functions/v1/<name>". "/rest/v1" is PostgREST's
// prefix and has no business in a function path — concatenating all three
// produced "/functions/rest/v1/v1/health", which 404s, and /day duly
// reported Supabase unreachable every single time.
