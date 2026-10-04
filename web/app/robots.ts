import type { MetadataRoute } from "next";

import { env, getSiteUrl } from "@/shared/config";
import { buildRobots } from "@/shared/lib/seo";

// ADR 0032 — the DEV_MODE/base-URL branching itself is a pure function
// (shared/lib/seo/build-robots.ts, unit tested) so it doesn't need a
// Next.js runtime to verify.
const robots = (): MetadataRoute.Robots => buildRobots({ devMode: env.DEV_MODE, siteUrl: getSiteUrl() });

export default robots;
