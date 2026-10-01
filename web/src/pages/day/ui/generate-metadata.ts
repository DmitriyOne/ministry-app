import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// noindex/nofollow (ADR 0032): /day is the installed app itself, behind
// LaunchGate's install check (ADR 0017/0019) — nothing here is a public
// document to send a search visitor to.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.day.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
