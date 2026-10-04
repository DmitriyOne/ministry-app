import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// noindex/nofollow (ADR 0032): a device placeholder, not a document —
// nothing here is worth a search result of its own.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.access.desktop.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
