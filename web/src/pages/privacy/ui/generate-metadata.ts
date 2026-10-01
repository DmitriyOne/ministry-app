import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// Indexable — see pages/about/ui/generate-metadata.ts for the shield
// caveat, identical here.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.privacy.metadata");

  return buildPageMetadata({ title: t("title"), description: t("description") });
};
