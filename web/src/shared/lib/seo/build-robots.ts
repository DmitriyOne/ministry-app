import type { MetadataRoute } from "next";

import { routes } from "@/shared/config/routes";

type BuildRobotsInput = {
  // env.DEV_MODE (web/shared/config/env.ts) — passed in rather than read
  // here so this stays a pure function, testable without a Next.js
  // runtime (see build-robots.test.ts).
  devMode: boolean;
  // getSiteUrl() (web/shared/config/env.ts) — undefined when neither
  // SITE_URL nor Vercel's VERCEL_PROJECT_PRODUCTION_URL is available.
  siteUrl: string | undefined;
};

// ADR 0032. DEV_MODE disables the "iPhone Safari only" shield entirely
// (web/proxy.ts) — robots must disable crawling just as completely, so
// a development or preview deployment is never indexed even by
// accident. With the shield active, only /about and /privacy are
// public documents; /day, /soon, /install are behind the install gate
// and /access/* are device placeholders — none of them belongs in a
// search index.
export const buildRobots = ({ devMode, siteUrl }: BuildRobotsInput): MetadataRoute.Robots => {
  if (devMode) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: {
      userAgent: "*",
      allow: [routes.about, routes.privacy],
      disallow: [
        routes.day,
        routes.soon,
        routes.install,
        routes.accessDesktop,
        routes.accessAndroid,
        routes.accessIosBrowser,
      ],
    },
    // No sitemap reference without a confirmed base URL — a relative
    // Sitemap: line isn't valid, and there is nothing to point at yet.
    ...(siteUrl ? { sitemap: `${siteUrl}/sitemap.xml` } : {}),
  };
};
