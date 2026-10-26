import { getTranslations } from "next-intl/server";

import { HoursCardSkeleton } from "@/features/hours-entry";
import { CenteredState } from "@/shared/ui/centered-state";
import { Title } from "@/shared/ui/title";

// What /day shows while the server answers (its loading.tsx re-exports
// this). Not the waiting screen ADR 0055 rejected: no spinner, nothing
// working is hidden behind it — the day's hours are simply not known
// yet — and the navigation stays put, because it lives in the layout.
//
// Composition only, like ProfileScreenSkeleton: the waiting state of a
// block belongs beside the block, so the two cannot drift apart. This
// file used to hold a copy of the card's own markup, down to its
// paddings (ADR 0062, the 2026-10-26 review).
export const DayScreenSkeleton = async () => {
  const t = await getTranslations("screens.day");

  return (
    // Deliberately the same classes as DayPage's CenteredState: the two
    // are the same screen in two states, and any difference here would
    // show up as a jump at the moment the data arrives.
    <CenteredState fill className="items-stretch justify-start gap-5 px-5 pt-6 text-left">
      <Title>{t("title")}</Title>

      <HoursCardSkeleton />
    </CenteredState>
  );
};
