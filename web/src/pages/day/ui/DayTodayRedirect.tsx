import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { currentDayKey, dayPath } from "@/entities/ministry-day";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { Title } from "@/shared/ui/title";

import { readTimeZone } from "../api/read-time-zone";
import { DayScreenFrame } from "./DayScreenFrame";

// What the bare /day is: the address that works out which day today is
// and sends the person to it.
//
// Every /day carries its date (the owner, 2026-10-27), and this is what
// keeps that promise without the navigation or the manifest's start_url
// having to know today's date — they could not, since today depends on
// the person's own calendar, which is a row in the database. The cost is
// one hop at launch, named in ADR 0063.
//
// Nothing is rendered on the way through: `redirect` throws, so it is
// called outside any try/catch (the Next.js rule — a catch would swallow
// the navigation and the person would stay here).
export const DayTodayRedirect = async () => {
  const zone = await readTimeZone();

  if (zone.status === "ready") redirect(dayPath(currentDayKey(zone.timeZone)));

  const t = await getTranslations("screens.day");

  // We do not know which day today is for this person, and the default
  // zone is not a safe guess: redirecting with it would open — and let
  // one tap write to — the wrong day. So the screen says so and offers
  // the retry, exactly as it does when the hours themselves do not load.
  return (
    <DayScreenFrame heading={<Title>{t("title")}</Title>}>
      <ScreenLoadFailure
        eyebrow={t("hours.label")}
        title={t("loadFailure.title")}
        text={t("loadFailure.text")}
      />
    </DayScreenFrame>
  );
};
