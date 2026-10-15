import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// Not indexable, unlike /about and /privacy: this screen lives behind a
// session (ROUTE_POLICY marks it an app screen), so there is nothing for
// a crawler to reach even if the device shield let one through.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.whatsNew.metadata");

  return buildPageMetadata({ title: t("title"), description: t("description"), robots: { index: false, follow: false } });
};
