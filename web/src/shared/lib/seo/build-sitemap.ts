import type { MetadataRoute } from "next";

import { routes } from "@/shared/config/routes";

type BuildSitemapInput = {
  // See build-robots.ts — same reasoning for taking these as plain
  // arguments instead of reading env directly.
  devMode: boolean;
  siteUrl: string | undefined;
};

// ADR 0032. Empty under DEV_MODE (nothing should be indexed) or without
// a confirmed base URL (every sitemap <url> must be absolute per the
// Sitemaps protocol — there is nothing correct to emit). Lists only the
// two publicly meaningful documents: /day, /soon, /install are behind
// the install gate and /access/* are device placeholders, neither
// belongs in a sitemap even once a domain is confirmed.
export const buildSitemap = ({ devMode, siteUrl }: BuildSitemapInput): MetadataRoute.Sitemap => {
  if (devMode || !siteUrl) return [];

  return [
    { path: routes.about, priority: 0.8 },
    { path: routes.privacy, priority: 0.5 },
  ].map(({ path, priority }) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: "monthly",
    priority,
  }));
};
