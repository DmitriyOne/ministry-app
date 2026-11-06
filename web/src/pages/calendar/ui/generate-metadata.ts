import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { monthHeading, parseMonthSlug } from "@/entities/ministry-status";
import { buildPageMetadata } from "@/shared/lib/metadata";

type GenerateMetadataProps = {
  params: Promise<{ month: string }>;
};

// noindex/nofollow (ADR 0032): this is the installed app, not a public
// document.
//
// The title names the month for the same reason the day's names the day
// — it is what iOS shows in the app switcher — and it needs no database
// at all: the month is in the address.
export const generateMetadata = async (
  { params }: GenerateMetadataProps,
): Promise<Metadata> => {
  const t = await getTranslations("screens.calendar.metadata");
  const month = parseMonthSlug((await params).month);

  return buildPageMetadata({
    // An address the screen is about to turn into a 404: the plain title
    // is the honest answer, because there is no month to name.
    title: month === null ? t("title") : monthHeading(month),
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
