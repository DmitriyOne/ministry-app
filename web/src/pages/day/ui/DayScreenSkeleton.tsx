import { HoursCardSkeleton } from "@/features/hours-entry";
import { Skeleton } from "@/shared/ui/skeleton";

import { DayScreenFrame } from "./DayScreenFrame";

// What /day shows while the server answers (its loading.tsx re-exports
// this). Not the waiting screen ADR 0055 rejected: no spinner, nothing
// working is hidden behind it — the day's hours are simply not known
// yet — and the navigation stays put, because it lives in the layout.
//
// Composition only, like ProfileScreenSkeleton: the waiting state of a
// block belongs beside the block, so the two cannot drift apart. This
// file used to hold a copy of the card's own markup, down to its
// paddings (ADR 0062, the 2026-10-26 review).
export const DayScreenSkeleton = () => (
  <DayScreenFrame
    heading={(
      // Plates, not the word "Day": a loading boundary cannot read the
      // route's segment, so this file has no way to know which day is
      // coming — and a heading that said "Day" and then became "Today"
      // would be a jump on every navigation between days. Two arrow
      // plates, because both arrows are always drawn: forward is
      // disabled on today, not absent.
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Skeleton className="h-3 w-20 rounded-sm" />
          <Skeleton className="h-8 w-36 rounded-md" />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </header>
    )}
  >
    <HoursCardSkeleton />
  </DayScreenFrame>
);
