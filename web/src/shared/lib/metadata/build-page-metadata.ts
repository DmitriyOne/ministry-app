import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { locale } from "@/shared/config";

type BuildPageMetadataInput = {
  title: string;
  description: string;
  robots?: Metadata["robots"];
};

// Every screen's generateMetadata funnels through this helper (ADR
// 0032) instead of returning its own ad-hoc object. Reason: Next.js
// shallow-merges `metadata.openGraph` per route segment (see
// generate-metadata.md's "Merging" — a page that sets openGraph.title
// alone REPLACES the whole openGraph object, losing type/locale/
// siteName inherited from the root layout, not just adding to it). A
// page that only set { openGraph: { title, description } } would ship
// with a broken Open Graph preview. siteName is read from the
// dictionary's own metadata.title (ADR 0014) here, not a literal in
// this file — the product name lives in exactly one place either way.
export const buildPageMetadata = async ({
  title,
  description,
  robots,
}: BuildPageMetadataInput): Promise<Metadata> => {
  const t = await getTranslations("metadata");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      // Open Graph wants the underscore form ("en_GB"), next-intl's
      // locale uses the BCP 47 hyphen form ("en-GB") — derived, not a
      // second hardcoded locale literal.
      locale: locale.replace("-", "_"),
      siteName: t("title"),
    },
    ...(robots ? { robots } : {}),
  };
};
