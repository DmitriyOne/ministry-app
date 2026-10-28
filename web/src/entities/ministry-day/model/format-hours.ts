// Minutes, read as a clock. The one way this app prints an amount of
// ministry, and it prints the same way whatever the amount is of: one
// day in the hours card, a whole month or a service year in the progress
// block (ADR 0064).
//
// It lived in features/hours-entry until the progress block asked for
// it, which is when FSD says to move a thing down rather than when one
// might guess it will be wanted (v2.1 "Pages First"): a second copy of
// this would print 272:00 and 272:0 on one screen.
//
// Here rather than in shared/lib for a reason that is this project's and
// not FSD's: shared/lib sits at exactly the 15 modules steiger allows
// (CLAUDE.md, measured 2026-10-27), so a sixteenth folder there fails
// `pnpm lint`. The entity is the better home anyway — minutes recorded
// against a day are what `ministry_days.minutes` holds.
//
// "0:00", "1:05", "24:00", "272:00". Hours are not padded and minutes
// always are, which is how a clock reads; the call sites draw it with
// tabular figures so the number does not jitter as it changes.
export const formatHours = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  return `${hours}:${String(rest).padStart(2, "0")}`;
};
