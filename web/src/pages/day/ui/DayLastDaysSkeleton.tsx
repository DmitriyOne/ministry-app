import { getTranslations } from "next-intl/server";

import { LastDaysShell, LastDaysWaitingRow } from "./LastDaysShell";

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
// The plates themselves are in LastDaysShell, because the strip shows
// the same ones for a frame after the days arrive, while it works out
// where it stands (ADR 0065, update 2026-11-09).
export const DayLastDaysSkeleton = async () => {
  const t = await getTranslations("screens.day.lastDays");

  return (
    <LastDaysShell label={t("label")}>
      <LastDaysWaitingRow />
    </LastDaysShell>
  );
};
