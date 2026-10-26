import type { ElementType, ReactNode } from "react";

import { Eyebrow } from "@/shared/ui/eyebrow";
import { cn } from "@/shared/lib/cn";

// A read that failed, wearing the shape of the block it replaces: a
// filled card with a sign, a heading, one line of explanation and the
// way out of it. Notice is the other half of this pair and stays what it
// is — a plate inside a form, for something the person has to act on.
// This is for a block of the screen that has nothing to show at all
// (ADR 0062, the owner's choice of 2026-10-26: the card keeps its
// shape).
//
// One fill, --hero, on both screens that use it: the owner compared the
// two mock-ups and chose the deep green of "header says it" for
// /profile as well (2026-10-26), so the lighter --primary version is
// gone. The sign is mint, which is the one surface that colour is
// allowed on (ADR 0011), and the explanation is white at 65%.
type FailureCardProps = {
  icon: ReactNode;
  title: ReactNode;
  text: ReactNode;
  // The label the replaced block carried, when it had one: /day keeps
  // "Hours" above the failure, so the card reads as that block rather
  // than as something new that appeared.
  eyebrow?: ReactNode;
  // The heading level in the document, decided by the screen: this card
  // never holds the screen's own h1.
  titleAs?: ElementType;
  // What to do about it, usually a retry button. Left out when there is
  // nothing worth offering.
  action?: ReactNode;
  className?: string;
};

export const FailureCard = ({
  icon,
  title,
  text,
  eyebrow,
  titleAs: Title = "h2",
  action,
  className,
}: FailureCardProps) => (
  <section
    className={cn(
      // The hours card's own measurements, not a round number: this card
      // stands in its place, and a few pixels of difference showed up as
      // a jump the moment the read failed.
      "flex flex-col gap-4.5 rounded-2xl bg-hero px-5.5 pt-5.5 pb-4.5 text-hero-foreground",
      className,
    )}
  >
    {eyebrow ? <Eyebrow className="text-white/50">{eyebrow}</Eyebrow> : null}

    {/* The sign sits beside the words, not above them: the card has to
        stay the height of a message, and a stacked sign turned it into a
        screen of its own (the owner, 2026-10-26). */}
    <div className="flex items-start gap-3.5">
      <span
        aria-hidden="true"
        className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/10 text-positive-hero"
      >
        {icon}
      </span>

      <div className="flex min-w-0 flex-col gap-1">
        <Title className="text-list-row font-620 tracking-list-row">{title}</Title>
        <p className="text-body font-500 text-pretty text-hero-foreground/65">{text}</p>
      </div>
    </div>

    {action}
  </section>
);
