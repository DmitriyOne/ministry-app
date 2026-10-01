import type { MetadataRoute } from "next";

import { env, getSiteUrl } from "@/shared/config";
import { buildSitemap } from "@/shared/lib/seo";

// ADR 0032 — see robots.ts: the branching itself lives in
// shared/lib/seo/build-sitemap.ts as a pure, unit-tested function.
const sitemap = (): MetadataRoute.Sitemap => buildSitemap({ devMode: env.DEV_MODE, siteUrl: getSiteUrl() });

export default sitemap;
