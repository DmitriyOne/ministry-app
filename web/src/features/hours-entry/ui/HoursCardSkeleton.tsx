import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/shared/ui/skeleton";

import { HOURS_STEP_MINUTES } from "../model/hours-value";
import { HoursCardShell } from "./HoursCardShell";

// The hours card while the database is still answering. It lives beside
// the card rather than inside the day screen's skeleton, which is the
// convention /profile already follows: a block owns its own waiting
// state, so the two cannot drift apart (ADR 0059).
//
// Only what the DATABASE has to answer gets a plate: the one number in
// the middle. The card, its label and the step are dictionary text and
// depend on nobody, so they are drawn for real and do not move when the
// data lands.
//
// The buttons are plates rather than real buttons: a real button here
// would invite a tap that has nowhere to go — the card is not mounted
// yet and the tap would be lost, not queued.
export const HoursCardSkeleton = async () => {
  const t = await getTranslations("screens.day.hours");

  return (
    <HoursCardShell label={t("label")} step={t("step", { minutes: HOURS_STEP_MINUTES })}>
      {/* The plates are lighter than the ground, like the ones on the
          profile's header: a darker grey would read as a hole punched in
          the card. */}
      <div className="flex items-center justify-between gap-3.5">
        <Skeleton className="size-14 shrink-0 rounded-full bg-white/12" />
        <Skeleton className="h-12 w-32 rounded-lg bg-white/15" />
        <Skeleton className="size-14 shrink-0 rounded-full bg-white/12" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-10 w-full rounded-sm bg-white/10" />
        <Skeleton className="h-10 w-full rounded-sm bg-white/10" />
        <Skeleton className="h-10 w-full rounded-sm bg-white/10" />
      </div>
    </HoursCardShell>
  );
};
