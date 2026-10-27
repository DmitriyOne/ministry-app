import { getTranslations } from "next-intl/server";

import { HoursCardSkeleton } from "@/features/hours-entry";
import { Title } from "@/shared/ui/title";

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
export const DayScreenSkeleton = async () => {
  const t = await getTranslations("screens.day");

  return (
    <DayScreenFrame heading={<Title>{t("title")}</Title>}>
      <HoursCardSkeleton />
    </DayScreenFrame>
  );
};
