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
// A chip is a fixed 42px wide rather than a seventh of the row, which
// is what it was while the strip held exactly seven chips (ADR 0065,
// update 2026-11-09). At 390px — the width this app is built for — the
// arithmetic lands in the same place: seven chips and six 4px gaps fill
// the card's inner 318px exactly, so the strip looks unchanged at rest.
// On a wider phone the chips keep their size and part of an eighth
// shows at the edge, which is the strip saying there is more of it.
//
// `pressable` is deliberately not part of the chip's shape: it belongs
// to the links and to nothing else. On the open day's chip — a div with
// nowhere to go — on a day still to come, and on a skeleton plate, a
// press that squeezes says something happened when nothing did, which
// is the defect ADR 0012 recorded for disabled buttons and fixed across
// the app on 2026-10-28.
export const LAST_DAYS_CHIP
  = "flex w-10.5 shrink-0 flex-col items-center gap-1 rounded-sm px-0.5 py-2";

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
