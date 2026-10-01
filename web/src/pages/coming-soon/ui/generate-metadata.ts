import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// noindex/nofollow (ADR 0032): /soon is the installed app under
// LAUNCH_MODE === "coming-soon" (web/proxy.ts), reached the same way
// /day is — not a public landing page.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.comingSoon.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
