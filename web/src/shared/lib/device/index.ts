// Three questions this app asks the device it is running on, and nothing
// else: how it was launched, how much of the screen the keyboard is
// covering, and whether a haptic tick is worth attempting.
//
// A group rather than three top-level modules because `shared/lib` passed
// steiger's threshold of 15 when haptics arrived (ADR 0060): the rule's
// own remedy is grouping, the same answer the `pages` layer got in ADR
// 0055 — a rule that gets in the way is satisfied, not switched off.
//
// What they have in common is not the subject but the terms: all three
// read the live environment, so none of them can be called while the
// server renders, and all three answer "no" rather than throwing when the
// browser has no opinion. A module that reads configuration, or anything
// a build decides, does not belong here.
export { isStandaloneDisplayMode } from "./display-mode";
export { resolveKeyboardInset } from "./keyboard-inset";
