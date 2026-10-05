import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// noindex/nofollow (ADR 0032) — but NOT for the reason first written
// here. That reason was "/soon is the installed app, not a public
// landing page", and ADR 0045 made it a public landing page, so the
// premise is gone.
//
// It stays noindex because lifting it would change nothing: the
// User-Agent shield in web/proxy.ts redirects anything that is not
// iPhone Safari to /access/*, and crawlers do not present as iPhone
// Safari — ADR 0032's "shield caveat". Making /soon indexable is a
// separate decision that has to deal with the shield first, not a flag
// to flip here.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.comingSoon.metadata");

  return buildPageMetadata({
    title: t("title"),
    description: t("description"),
    robots: { index: false, follow: false },
  });
};
