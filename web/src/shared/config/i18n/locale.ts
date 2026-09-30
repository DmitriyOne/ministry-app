// The only supported locale (see ADR 0014, ADR 0023). A dedicated module
// rather than a literal inline in request.ts/types.ts — both read the same
// value, so adding a language later is a one-place change.
export const locale = "en-GB";
export type AppLocale = typeof locale;
