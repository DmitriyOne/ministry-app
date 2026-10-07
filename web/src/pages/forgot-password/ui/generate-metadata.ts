import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// Not indexable, for the same reason as the sign-in screen: there is
// nothing here for a search engine to show.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.forgotPassword.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false },
  });
};
