import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// Not indexable: there is nothing on a sign-in screen for a search engine
// to show.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.login.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false },
  });
};
