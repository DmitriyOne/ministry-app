// Reads a CSS <time> value ("700ms", "1.1s") as a number of milliseconds.
//
// It exists so the splash's timing has ONE home — the block of custom
// properties in globals.css — instead of the visual durations living in
// CSS and the dwell living in a TypeScript constant, where changing the
// look meant editing two files and knowing which. getComputedStyle always
// hands back a string, hence the parsing.
//
// null means "unusable", which the caller must handle as its own case
// rather than coercing to 0: a missing variable and a deliberate 0ms are
// different intentions, and silently treating the first as the second is
// how a timing bug becomes invisible.
export const parseCssDuration = (value: string): number | null => {
  const trimmed = value.trim();
  if (trimmed === "") return null;

  const match = /^(-?\d*\.?\d+)(ms|s)$/.exec(trimmed);
  if (!match) return null;

  const amount = Number(match[1]);
  if (!Number.isFinite(amount) || amount < 0) return null;

  return match[2] === "s" ? amount * 1000 : amount;
};
