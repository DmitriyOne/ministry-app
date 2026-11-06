import { Skeleton } from "@/shared/ui/skeleton";

import { CalendarScreenFrame } from "./CalendarScreenFrame";

// The calendar while the database is still answering (ADR 0059).
//
// SIX rows of squares, which is the most a month can span (a 31-day
// month beginning on a Sunday), so the card never grows at the moment
// the figures land. Promising six and drawing five is a smaller jump
// than the other way round.
const WEEKS = 6;
const DAYS = 7;

export const CalendarScreenSkeleton = () => (
  <CalendarScreenFrame>
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-1.5">
        <Skeleton className="h-2.5 w-24 rounded-xs" />
        <Skeleton className="h-7 w-40 rounded-sm" />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="size-11 rounded-full" />
      </div>
    </header>

    <div className="rounded-2xl bg-card px-3 pt-3.5 pb-4 shadow-card">
      <div className="mb-1.5 grid grid-cols-7 gap-0.5">
        {Array.from({ length: DAYS }, (_, index) => (
          <Skeleton key={index} className="mx-auto h-2.5 w-6 rounded-xs" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: WEEKS * DAYS }, (_, index) => (
          <Skeleton key={index} className="aspect-square rounded-sm" />
        ))}
      </div>
    </div>

    {/* The day card's own height, so the screen does not jump when the
        selected day arrives. On the --hero fill the plates are white at
        15%, the tone DESIGN.md gives for a skeleton on green. */}
    <div className="flex flex-col gap-4 rounded-2xl bg-hero px-5 py-5">
      <div className="flex items-baseline justify-between gap-3">
        <Skeleton className="h-5 w-28 rounded-xs bg-white/15" />
        <Skeleton className="h-3 w-16 rounded-xs bg-white/15" />
      </div>
      <div className="flex gap-2.5">
        <Skeleton className="h-16 flex-1 rounded-lg bg-white/15" />
        <Skeleton className="h-16 flex-1 rounded-lg bg-white/15" />
      </div>
      <Skeleton className="h-[50px] w-full rounded-button bg-white/15" />
    </div>
  </CalendarScreenFrame>
);
