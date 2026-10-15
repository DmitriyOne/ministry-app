import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// Behind the session gate and the admin role, so there is nothing here to
// index.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.adminNewUser.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false },
  });
};
