import { HoursCardSkeleton } from "@/features/hours-entry";
import { Skeleton } from "@/shared/ui/skeleton";

import { LAST_DAYS_CHIP } from "./DayLastDays";
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

    {/* The progress block's own waiting state. Not beside the block in
        the way the card's is, because the block has nowhere else to
        live: it is this screen's (ADR 0064), so both halves are here.
        The bar's own track tone is the plate tone, so an empty track IS
        the skeleton and only the text needs plates — the track's classes
        below are the same line as ProgressTrack in shared/ui/progress.tsx
        and have to stay that way (ADR 0064, decision 12).

        ONE row, not two: the month's row is the one everybody gets,
        while the service year's appears only for a regular pioneer (ADR
        0064, decision 11). A second row here would be a promise this
        screen cannot keep for most people — and a plate that turns into
        nothing is worse than a row that arrives. */}
    <div className="flex flex-col gap-2.5 px-1">
      <Skeleton className="h-3 w-16 rounded-sm" />

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3.5 w-28 rounded-sm" />
          <Skeleton className="h-3.5 w-20 rounded-sm" />
        </div>
        <div className="h-1.5 rounded-full bg-ink-a09" />
      </div>
    </div>

    {/* The strip, in its own card and with all SEVEN chips — unlike the
        progress block above, every one of them always arrives (ADR
        0065), so a plate per chip promises nothing it cannot keep.
        The chips are built from the strip's own class string, so the
        two cannot drift apart in height or padding. */}
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card">
      <Skeleton className="h-3 w-20 rounded-sm" />

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }, (_, index) => (
          <div key={index} className={`${LAST_DAYS_CHIP} bg-background`}>
            <Skeleton className="h-2.5 w-6 rounded-xs" />
            <Skeleton className="h-4 w-5 rounded-xs" />
            <Skeleton className="h-2.5 w-7 rounded-xs" />
          </div>
        ))}
      </div>
    </div>
  </DayScreenFrame>
);
