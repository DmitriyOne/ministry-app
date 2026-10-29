// Whether the browser says it has no connection at all. Believed in one
// direction only, and that is the direction this is for: `false` from
// `navigator.onLine` means no request can leave the device, while `true`
// means no more than "an interface is up" — the same asymmetry ADR 0055
// built the connectivity probe on.
//
// What it buys the caller is the one failure that needs no guessing.
// Everywhere else "it did not work" leaves open whether the server took
// the request anyway; here it does not, because the request was never
// made.
//
// Answers "no" where there is no navigator — a server render, or a
// browser without the property — so nobody has to guard the call.
export const isOffline = (): boolean =>
  typeof navigator !== "undefined" && navigator.onLine === false;
