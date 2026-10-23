import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

// A green plate carrying one number: the goal for this month, the goal
// for the service year. Two of them sit side by side under the profile's
// header, and the pair is the whole use — a third tone or a second
// number would be a different component.
//
// `@shadcn/card` was looked at first, as the rule says (ADR 0012): it is
// a white container with a ring and seven parts, of which this uses two,
// and its ground, ring, padding and type would all be overridden. What
// would have remained is the `<div>`. Same verdict as HeroPill, for the
// same reasons.
//
// It renders `<dt>`/`<dd>`, so it belongs inside a `<dl>`: the pair is
// two terms and their values, and a screen reader then reads "Monthly
// goal, 30 hours" rather than four loose lines.
//
// The label's colour is NOT the same on both tones, and that is measured
// rather than chosen: mint on `--hero` is 5.8:1, but mint on the lighter
// `--primary` is 3.5:1 and fails AA for 11px text (ADR 0011 allows mint
// on --hero alone, and this is why). White on `--primary` is 6:1, so the
// lighter plate says its label in white and leans on size for the
// hierarchy instead.
const TONE = {
  primary: { surface: "bg-primary", label: "text-hero-foreground" },
  deep: { surface: "bg-hero", label: "text-positive-hero" },
} as const;

type GoalCardProps = {
  tone: keyof typeof TONE;
  label: ReactNode;
  // Already in words — "30 h", or a dash for no goal at all. Formatting
  // a number into a sentence is the screen's business, not this
  // component's (the shared/ui boundary, ADR 0013).
  value: ReactNode;
};

export const GoalCard = ({ tone, label, value }: GoalCardProps) => (
  <div
    className={cn(
      "flex flex-col gap-3.5 rounded-2xl px-4.5 pt-4.5 pb-5 text-hero-foreground",
      TONE[tone].surface,
    )}
  >
    <dt className={cn("text-eyebrow font-600 tracking-eyebrow uppercase", TONE[tone].label)}>
      {label}
    </dt>
    {/* tabular-nums so 30 and 360 keep the same stride; the two plates
        sit side by side and a number that shifts between renders reads
        as a glitch. */}
    <dd className="text-totals font-640 tracking-totals tabular-nums">{value}</dd>
  </div>
);
