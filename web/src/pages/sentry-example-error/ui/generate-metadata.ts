import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// A debug page: never indexed, whatever the environment.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.sentryExampleError.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
