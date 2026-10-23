import { getTranslations } from "next-intl/server";

import { GoalCard } from "@/shared/ui/goal-card";
import { Skeleton } from "@/shared/ui/skeleton";

// The cards themselves, in their own colours, with a plate where the
// number will be. Built from GoalCard rather than from a copy of its
// classes, so the loading state cannot differ from the loaded one by
// construction — not by anyone remembering to keep two files in step.
//
// The labels are drawn for real: they are dictionary text and depend on
// nobody, so greying them out would hide something already known and
// make the card change in two places instead of one. That is the same
// rule the rest of this screen follows — a plate only for what the
// DATABASE has to answer.
//
// The plates are lighter than the ground, like the ones on the header:
// a darker grey would read as a hole punched in the card.
const BONE = "bg-white/15";

export const MinistryGoalsSkeleton = async () => {
  const t = await getTranslations("screens.profile.goals");

  return (
    <dl className="grid grid-cols-2 gap-3">
      <GoalCard
        tone="primary"
        label={t("month")}
        value={<Skeleton className={`h-11 w-3/5 rounded-lg ${BONE}`} />}
      />
      {/* Wider, because the year's number has one more digit than the
          month's and the plate should let it grow into place rather
          than shrink. */}
      <GoalCard
        tone="deep"
        label={t("year")}
        value={<Skeleton className={`h-11 w-3/4 rounded-lg ${BONE}`} />}
      />
    </dl>
  );
};
