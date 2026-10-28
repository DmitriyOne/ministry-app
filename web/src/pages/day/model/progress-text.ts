import { splitDuration } from "@/entities/ministry-day";

import { goalStanding } from "./goal-standing";

// Which words the progress block's bracket uses, and which colour it
// takes. Decisions, so they live here with tests rather than inside the
// component (the owner, 2026-10-28): what was left in DayProgress before
// its `return` was a chain of "if this number is zero say it another
// way", and nothing could reach it but the eye.
//
// The dictionary is passed IN rather than imported, which is what keeps
// this a pure function: next-intl's `t` is bound to a request on the
// server, and a module that fetched its own translator could not be
// called from a test without one. The key union below is narrower than
// the namespace, so a key this module invents — rather than one the
// dictionary really has — fails `pnpm typecheck` at the call site.
export type ProgressPhrase = "ahead" | "behind" | "level" | "hours" | "minutes" | "hoursMinutes";

export type TranslateProgress = (
  key: ProgressPhrase,
  values?: Record<string, string | number>,
) => string;

// Short of the goal is drawn in --negative, level with it or past it in
// the project's green (the owner's mock-ups, 2026-10-28). The tone is
// named, not classed: which class carries it is the component's business.
export type ProgressTone = "met" | "short";

export type ProgressStanding = {
  text: string;
  tone: ProgressTone;
};

// "1 h 30 min", "15 min", "134 h" — spelled out rather than as a clock.
// A difference is not a time of day, and "−1:30" beside "0:30" would be
// two numbers of the same shape meaning different things.
//
// Whole hours drop the minutes and a bare remainder drops the hours,
// because "28 h 0 min" and "0 h 15 min" are both longer and harder to
// read than what they say.
export const progressAmount = (translate: TranslateProgress, total: number): string => {
  const { hours, minutes } = splitDuration(total);

  if (hours === 0) return translate("minutes", { minutes });

  if (minutes === 0) return translate("hours", { hours });

  return translate("hoursMinutes", { hours, minutes });
};

// The bracket: how this total stands against the WHOLE goal — what is
// still owed, or by how much it is beaten (ADR 0064, decision 10).
//
// Against the whole goal, and not against the share of it due by today,
// which is what this said until the owner saw the result on 28 October:
// "1:50 (−25 h 16 min)". Both the odd minutes (a goal divided by the
// days of the month rarely lands on one) and the hidden reference point
// made it a number to decipher rather than read. A monthly goal is a
// figure people already keep in their heads; this bracket says the plain
// rest of it.
//
// Level says "(+0)" rather than "+0 min" — the owner's mock-up, and it
// reads as a state rather than as a measurement of nothing.
export const progressStanding = (
  translate: TranslateProgress,
  servedMinutes: number,
  goalHours: number,
): ProgressStanding => {
  const against = goalStanding(servedMinutes, goalHours);

  if (against.kind === "level") return { text: translate("level"), tone: "met" };

  const amount = progressAmount(translate, against.minutes);

  return against.kind === "ahead"
    ? { text: translate("ahead", { amount }), tone: "met" }
    : { text: translate("behind", { amount }), tone: "short" };
};
