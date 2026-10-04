import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// noindex/nofollow (ADR 0032): /install is a step in the install flow,
// reached from LaunchGate (ADR 0017/0019) when display-mode isn't
// standalone yet — not a page worth ranking on its own.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.installApp.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
