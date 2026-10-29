import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/shared/ui/skeleton";

import { LAST_DAYS_CHIPS } from "../model/last-days";
import { LAST_DAYS_CHIP, LastDaysShell } from "./LastDaysShell";

// The strip while the database is still answering. Beside the strip
// rather than inside the screen's skeleton, which is the convention both
// the hours card and /profile follow: a block owns its waiting state, so
// the two cannot drift apart (ADR 0059).
//
// Only what the DATABASE has to answer gets a plate. "Last days" is
// dictionary text and depends on nobody, so it is drawn for real and
// does not move when the days land — the same reading HoursCardSkeleton
// makes about its own label.
//
// All SEVEN chips, unlike the progress block above, where only the
// month's row is drawn: every chip here always arrives, so a plate per
// chip promises nothing it cannot keep. The count comes from the model
// (LAST_DAYS_CHIPS) and the chip's shape from the shell the strip uses,
// so neither can disagree with what lands.
export const DayLastDaysSkeleton = async () => {
  const t = await getTranslations("screens.day.lastDays");

  return (
    <LastDaysShell label={t("label")}>
      {Array.from({ length: LAST_DAYS_CHIPS }, (_, index) => (
        <div key={index} className={`${LAST_DAYS_CHIP} bg-background`}>
          <Skeleton className="h-2.5 w-6 rounded-xs" />
          <Skeleton className="h-4 w-5 rounded-xs" />
          <Skeleton className="h-2.5 w-7 rounded-xs" />
        </div>
      ))}
    </LastDaysShell>
  );
};
