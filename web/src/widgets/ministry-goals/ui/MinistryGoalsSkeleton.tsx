import { Skeleton } from "@/shared/ui/skeleton";

// Built out of the real card's own spacing rather than a guessed height:
// 18 top, the label's line, 14 between, the number's line, 20 bottom.
//
// The grounds are the quiet grey of the white cards, not the greens a
// real card wears: a green plate with nothing on it reads as a card that
// failed to load rather than one still loading.
const BONE = "bg-ink-a09";

export const MinistryGoalsSkeleton = () => (
  <div className="grid grid-cols-2 gap-3">
    <div className="flex flex-col gap-3.5 rounded-2xl bg-ink-a05 px-4.5 pt-4.5 pb-5">
      <Skeleton className={`h-4 w-2/3 rounded-sm ${BONE}`} />
      <Skeleton className={`h-11 w-3/5 rounded-lg ${BONE}`} />
    </div>
    <div className="flex flex-col gap-3.5 rounded-2xl bg-ink-a05 px-4.5 pt-4.5 pb-5">
      <Skeleton className={`h-4 w-2/3 rounded-sm ${BONE}`} />
      <Skeleton className={`h-11 w-3/4 rounded-lg ${BONE}`} />
    </div>
  </div>
);
