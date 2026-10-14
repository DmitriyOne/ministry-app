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

// Whether a person should see the "there is something new" marker.
//
// Not `seen !== APP_VERSION`, which was the first cut and is wrong twice.
// A rollback makes the stored version NEWER than the running one, and
// plain inequality reads that as unread — the dot returns for someone who
// has read more than the app is currently showing. And a profile that
// failed to load is not the same as a profile that has read nothing: the
// caller passes `null` for the first case and gets no marker, because a
// database failure should not surface as a claim about news.
//
// Anything that is not a plain x.y.z is treated as unread rather than
// guessed at. The CI check refuses such a version on the way out
// (ci.yml, version-bump), so this is the belt to that braces.
export const hasUnreadVersion = (seen: string | null, current: string): boolean => {
  if (seen === null || seen === "") return true;

  const parse = (value: string): number[] | null =>
    /^\d+\.\d+\.\d+$/.test(value) ? value.split(".").map(Number) : null;

  const seenParts = parse(seen);
  const currentParts = parse(current);

  if (seenParts === null || currentParts === null) return true;

  const differs = currentParts.findIndex((part, index) => part !== seenParts[index]);

  return differs !== -1 && currentParts[differs] > seenParts[differs];
};
