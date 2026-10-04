import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// noindex/nofollow — see pages/desktop-block/ui/generate-metadata.ts.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.access.android.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
