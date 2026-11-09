import type { ReactNode } from "react";

import { Eyebrow } from "@/shared/ui/eyebrow";
import { Skeleton } from "@/shared/ui/skeleton";

import { LAST_DAYS_SKELETON_CHIPS } from "../model/last-days";

// The strip's card and the shape of the chips inside it, in one place
// because two files have to agree on them: the strip itself and the
// skeleton /day draws while the days are being read. Exactly the
// arrangement HoursCardShell has, and for the reason its own comment
// gives — the skeleton used to hold a copy of the card's markup down to
// its paddings, and two copies of a padding are what nobody keeps in
// step (ADR 0062's review; ADR 0065, decision 10).
//
// No "use client" and no dictionary of its own: the label arrives as a
// prop. The strip is a client component now and the skeleton is not,
// which is exactly why this file is neither.
//
// The ROW is here and the scrolling is not. The strip scrolls and needs
// a ref on that element to do it; the skeleton has nothing to scroll.
// So both share the row's layout and each says for itself what happens
// at its edges.
//
// A chip is a SEVENTH of what the card shows, which is what it was
// before the strip could scroll — and going back to that is what makes
// the strip stand still at rest (ADR 0065, update 2026-11-09).
//
// A fixed 42px was tried first. At 390px it is the same number, because
// seven chips and six 4px gaps fill the card's inner 318px exactly; at
// any other width it is not, and then the resting position — today
// against the right edge — leaves a chip sliced down the middle at the
// left. Against the skeleton's seven whole plates that reads as the
// strip jumping as it arrives, which is what the owner saw.
//
// Percentages resolve against what the scroller SHOWS, not against
// everything it holds, so this is seven across at every width, and the
// left edge lands on a chip boundary wherever the right edge does. The
// seven and the 1.5rem are the six gaps between them — `gap-1` below —
// and the three have to be changed together: Tailwind reads classes as
// text and cannot take them from LAST_DAYS_SKELETON_CHIPS.
//
// `pressable` is deliberately not part of the chip's shape: it belongs
// to the links and to nothing else. On the open day's chip — a div with
// nowhere to go — on a day still to come, and on a skeleton plate, a
// press that squeezes says something happened when nothing did, which
// is the defect ADR 0012 recorded for disabled buttons and fixed across
// the app on 2026-10-28.
export const LAST_DAYS_CHIP
  = "flex w-[calc((100%-1.5rem)/7)] shrink-0 flex-col items-center gap-1 rounded-sm px-0.5 py-2";

export const LAST_DAYS_ROW = "flex gap-1";

type LastDaysShellProps = {
  label: ReactNode;
  // Names the section from the label. The skeleton passes none: there is
  // nothing in it yet for a name to point at.
  headingId?: string;
  children: ReactNode;
};

export const LastDaysShell = ({ label, headingId, children }: LastDaysShellProps) => (
  <section
    aria-labelledby={headingId}
    className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card"
  >
    <Eyebrow as="h2" id={headingId}>
      {label}
    </Eyebrow>

    {children}
  </section>
);

// The row of plates the card holds while it is waiting, and the one
// piece of this screen that two different kinds of waiting share.
//
// The loading boundary draws it while the database answers
// (DayLastDaysSkeleton). The strip itself draws it for one frame more:
// a scroll container cannot be placed by markup, so until the browser
// has run a line of ours the strip does not know where it stands, and
// what it would show in the meantime is its oldest week (the owner,
// 2026-11-09 — he had seen the strip settle itself on screen and said
// to wait with the skeleton instead).
//
// No "use client" here either: this is markup with no state, so the
// server component and the client one can each render it.
//
// It does NOT scroll and it hides what runs past its edge: there is
// nothing to reach by a gesture yet, and a waiting state that answers
// one promises something it cannot do.
export const LastDaysWaitingRow = () => (
  <div className={`${LAST_DAYS_ROW} overflow-hidden`}>
    {Array.from({ length: LAST_DAYS_SKELETON_CHIPS }, (_, index) => (
      <div key={index} className={`${LAST_DAYS_CHIP} bg-background`}>
        <Skeleton className="h-2.5 w-6 rounded-xs" />
        <Skeleton className="h-4 w-5 rounded-xs" />
        <Skeleton className="h-2.5 w-7 rounded-xs" />
      </div>
    ))}
  </div>
);
