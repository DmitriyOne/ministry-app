import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// noindex/nofollow (ADR 0032): Next.js already serves this with a 404
// status (ADR 0018), but a search engine that somehow indexed the URL
// before it 404'd shouldn't be encouraged to keep it.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.notFound.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
