import { splitDuration } from "./format-hours";

// A span of time said in words: "1 h 30 min", "15 min", "134 h".
//
// Not a clock. formatHours answers "how much was served that day" and
// prints 0:30; this answers "how much more" or "how long since", and
// "−1:30" beside "0:30" would be two numbers of the same shape meaning
// different things.
//
// Whole hours drop the minutes and a bare remainder drops the hours,
// because "28 h 0 min" and "0 h 15 min" are both longer and harder to
// read than what they say.
//
// Here rather than beside its first caller, which was the day screen's
// progress block: the month's pace line asks for the very same phrasing
// (ADR 0066, decision 12, update 2026-11-02), and a formatter per caller
// is the mistake this entity already records about MINUTES_IN_HOUR.
//
// The dictionary is passed IN, which is what keeps this pure: next-intl's
// `t` is bound to a request on the server, and a module that fetched its
// own translator could not be called from a test. The key union is
// narrower than any namespace, so a key this module invents — rather
// than one a dictionary really has — fails `pnpm typecheck` at the call
// site.
export type DurationPhraseKey = "hours" | "minutes" | "hoursMinutes";

export type TranslateDuration = (
  key: DurationPhraseKey,
  values?: Record<string, string | number>,
) => string;

export const durationPhrase = (translate: TranslateDuration, total: number): string => {
  const { hours, minutes } = splitDuration(total);

  if (hours === 0) return translate("minutes", { minutes });

  if (minutes === 0) return translate("hours", { hours });

  return translate("hoursMinutes", { hours, minutes });
};
