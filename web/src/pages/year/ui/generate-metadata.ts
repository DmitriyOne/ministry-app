import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// Behind the session gate, so there is nothing here to index.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.year.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false },
  });
};
