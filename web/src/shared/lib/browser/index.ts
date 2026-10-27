// Four questions this app asks the browser it is running in, and
// nothing else: how the page was launched, how much of the screen the
// keyboard covers, whether a haptic tick is worth attempting, and
// whether there is a connection at all.
//
// Named `browser`, not `device`: ADR 0015/0016 had a `shared/lib/device`
// for "what kind of device is this" (screen size), and it was deleted
// wholesale when access moved to the User-Agent. Bringing that name back
// with a different meaning would strand anybody who reads those ADRs
// first — and `config/env.ts` already owns the word "environment".
//
// One module rather than three, because `shared/lib` reached steiger's
// threshold of 15 top-level modules when the haptics check arrived (ADR
// 0060). The rule's own remedy is grouping, which is also the answer the
// `pages` layer got in ADR 0055 — a rule that gets in the way is
// satisfied, not switched off. In `shared/lib` a top-level folder must
// have a public API, so this is a module with an index, not a container
// of slices.
//
// What the three have in common is not their subject but their terms:
// each reads the live environment, so none can be called while the server
// renders, and each answers "no" instead of throwing when the browser has
// no opinion. A module that reads configuration, or anything a build
// decides, does not belong here.
export { isOffline } from "./is-offline";
export { isStandaloneDisplayMode } from "./is-standalone-display-mode";
export { resolveKeyboardInset } from "./resolve-keyboard-inset";
export { supportsHapticTap } from "./supports-haptic-tap";
