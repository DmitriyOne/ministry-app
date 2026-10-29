import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import {
  currentDayKey,
  dayHeading,
  type DayKey,
  formatDayDate,
  parseDayKey,
} from "@/entities/ministry-day";
import { buildPageMetadata } from "@/shared/lib/metadata";

import { readTimeZone } from "../api/read-time-zone";

type GenerateMetadataProps = {
  params: Promise<{ day: string }>;
};

const dayTitle = async (day: DayKey, timeZone: string | null): Promise<string> => {
  const t = await getTranslations("screens.day");
  const today = currentDayKey(timeZone);
  const heading = dayHeading(day, today);

  return t("metadata.dayTitle", {
    label: heading.kind === "weekday" ? heading.weekday : t(heading.kind),
    date: formatDayDate(day, today),
  });
};

// noindex/nofollow (ADR 0032): /day is the installed app itself, behind
// LaunchGate's install check (ADR 0017/0019) — nothing here is a public
// document to send a search visitor to.
//
// The title names the day because the app is a day at a time, and this
// string is what iOS shows in the app switcher: "Day" on every card
// tells the person nothing. The zone it needs is the one the screen
// reads, and `readTimeZone` is wrapped in React's `cache` — this call
// and the screen's are one round trip, not two.
export const generateMetadata = async (
  { params }: GenerateMetadataProps,
): Promise<Metadata> => {
  const t = await getTranslations("screens.day.metadata");
  const day = parseDayKey((await params).day);
  const zone = day ? await readTimeZone() : null;

  // An address the screen is about to turn into a 404, or a zone we
  // could not read: the plain title is the honest answer, and there is
  // nothing to name.
  const title = day && zone?.status === "ready"
    ? await dayTitle(day, zone.timeZone)
    : t("title");

  return buildPageMetadata({
    title,
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
