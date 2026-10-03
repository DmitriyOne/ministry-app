// Whether the debug pages (currently /sentry-example-error) may be served. They break
// the app on purpose, so they must never exist in production, where anyone
// could burn the Sentry quota with them. VERCEL_ENV is set by the Vercel
// platform, not by this project, hence a direct process.env read instead of
// the env.ts schema (same precedent as getSiteUrl()).
//
// A function, not a constant, for the same reason as getSiteUrl(): the value
// is a server concern and must not be evaluated in a client bundle that pulls
// in the shared/config barrel. In the browser it answers "no".
export const isDebugPageEnabled = (): boolean => {
  if (typeof window !== "undefined") return false;

  return process.env.VERCEL_ENV !== "production";
};
