import type { ReactNode } from "react";

import { Eyebrow } from "@/shared/ui/eyebrow";

// The strip's card and the row inside it, in one place because two files
// have to agree on them: the strip itself and the skeleton /day draws
// while the days are being read. Exactly the arrangement HoursCardShell
// has, and for the reason its own comment gives — the skeleton used to
// hold a copy of the card's markup down to its paddings, and two copies
// of a padding are what nobody keeps in step (ADR 0062's review; ADR
// 0065, decision 10).
//
// No "use client" and no dictionary of its own: the label arrives as a
// prop. Both callers here are server components, but keeping the label
// out means this file never has to care which of them is.
//
// The chip's outline is here too, because BOTH files that build chips
// want it and both already import this one. It lived in DayLastDays at
// first, which made the skeleton import the strip — and with it, down
// the graph, a client module it never renders.
//
// `pressable` is deliberately not part of it: it belongs to the six
// links and to nothing else. On the open day's chip — a div with
// nowhere to go — and on a skeleton plate, a press that squeezes says
// something happened when nothing did, which is the defect ADR 0012
// recorded for disabled buttons and fixed across the app on 2026-10-28.
export const LAST_DAYS_CHIP = "flex flex-col items-center gap-1 rounded-sm px-0.5 py-2";

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

    {/* Seven equal columns rather than a scrolling row: at 390px — the
        width this app is built for — they fit, and nothing a person
        needs ends up off the edge, where it cannot be seen without
        being scrolled to.

        The seven is spelled out because Tailwind reads classes as
        TEXT and cannot build one from a value, so this cannot be
        derived from LAST_DAYS_CHIPS (../model/last-days) — which is
        where the same seven is decided. A compile-time check was tried
        and does not exist: `PREVIOUS_DAYS + 1` is a number to
        TypeScript, not a 7. So the pair is kept in step by this note
        and the one beside that constant, the way the progress bar's
        track is (ADR 0064, decision 12). */}
    <div className="grid grid-cols-7 gap-1">{children}</div>
  </section>
);
