import type { ReactNode } from "react";

import { RabbitIcon, TurtleIcon } from "@/shared/ui/icons";

// The "pace deviation" feature gets its own dark card instead of a plain
// list row — a turtle/rabbit progress bar illustrates the idea better
// than a sentence alone. Solid RabbitIcon/TurtleIcon on this dark ground
// is the one deliberate exception to the otherwise-linear icon set, see
// ADR 0029/0030.
type PaceCardProps = {
  title: ReactNode;
  text: ReactNode;
};

export const PaceCard = ({ title, text }: PaceCardProps) => (
  <div className="flex flex-col gap-2.5 rounded-xl bg-hero px-4.5 py-4.5 pb-5">
    <div aria-hidden="true" className="flex items-center gap-3">
      <TurtleIcon size={22} className="text-negative-hero" />
      <div className="relative h-1 flex-1 rounded-full bg-white/18">
        <div className="absolute inset-y-0 left-0 right-[38%] rounded-full bg-linear-to-r from-negative-hero to-positive-hero" />
        <div className="absolute top-1/2 left-[62%] size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
      </div>
      <RabbitIcon size={20} className="text-positive-hero" />
    </div>
    <div className="flex flex-col gap-1.5">
      <p className="text-list-row font-620 tracking-list-row text-hero-foreground">{title}</p>
      {/* /60, not a fresh number — matches BodyText's hero tone
          (shared/ui/body-text.tsx), the project's one muted-on-hero
          value (WCAG AA, see ADR 0011). BodyText itself isn't reused
          here because it's sized for text-body (15px), not this card's
          text-caption (13px). */}
      <p className="text-caption font-500 text-pretty text-hero-foreground/60">{text}</p>
    </div>
  </div>
);
