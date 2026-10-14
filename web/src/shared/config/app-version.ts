// The product version, as declared in the repository's root package.json
// and inlined by next.config.ts.
//
// Not part of env.ts on purpose: `createEnv` describes environment
// configuration — values somebody sets per deployment and can get wrong.
// This is a fact about the build, like the commit it came from. Reading it
// through `process.env` directly follows the same precedent as
// VERCEL_PROJECT_PRODUCTION_URL (ADR 0032).
//
// The fallback exists for contexts that do not run next.config.ts at all —
// vitest, mainly. A test that depends on the real number should read
// package.json itself rather than trust this.
export const APP_VERSION = process.env.APP_VERSION ?? "0.0.0";
