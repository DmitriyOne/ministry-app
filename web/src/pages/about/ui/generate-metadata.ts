import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { buildPageMetadata } from "@/shared/lib/metadata";

// Indexable (ADR 0032) — one of the two public documents, along with
// /privacy. In practice crawlers never reach it while the User-Agent
// shield (web/proxy.ts, ADR 0016) is active: Googlebot/Bingbot/most
// preview bots don't present as iPhone Safari and get redirected to
// /access/* before this page renders — see ADR 0032's "shield caveat".
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("screens.about.metadata");

  return buildPageMetadata({ title: t("title"), description: t("description") });
};
