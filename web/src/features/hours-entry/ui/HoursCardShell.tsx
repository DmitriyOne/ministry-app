import type { ReactNode } from "react";

import { Caption } from "@/shared/ui/caption";
import { Eyebrow } from "@/shared/ui/eyebrow";

// The card's outline and its header row, in one place because three
// things have to agree on them: the card itself, the skeleton /day shows
// while the hours are being read, and — by hand, since it lives in
// shared/ui — the failure card that stands where this one would. The
// skeleton used to carry its own copy of these classes, and keeping two
// copies of a padding in step is exactly the work nobody does.
//
// No "use client" and no dictionary of its own: the label and the step
// arrive as props, because the card reads them with useTranslations and
// the skeleton with getTranslations. That is also what lets the same
// markup be rendered from both sides of the boundary.
type HoursCardShellProps = {
  label: ReactNode;
  step: ReactNode;
  // Set by the card, which gives the section its accessible name from
  // the label. The skeleton has nothing to name — there are no controls
  // in it yet.
  headingId?: string;
  children: ReactNode;
};

export const HoursCardShell = ({ label, step, headingId, children }: HoursCardShellProps) => (
  <section
    aria-labelledby={headingId}
    className="flex flex-col gap-4.5 rounded-2xl bg-hero px-5.5 pt-5.5 pb-4.5 text-hero-foreground"
  >
    <div className="flex items-center justify-between gap-3">
      <Eyebrow as="h2" id={headingId} className="text-white/50">
        {label}
      </Eyebrow>
      <Caption className="text-white/50">{step}</Caption>
    </div>

    {children}
  </section>
);
