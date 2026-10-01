import type { Metadata } from "next";

import { buildSocialMetadata } from "./build-social-metadata";

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
// with a broken Open Graph preview. The openGraph/twitter objects,
// preview image included, are built by buildSocialMetadata — the one
// place that declares them.
export const buildPageMetadata = async ({
  title,
  description,
  robots,
}: BuildPageMetadataInput): Promise<Metadata> => ({
  title,
  description,
  ...(await buildSocialMetadata({ title, description })),
  ...(robots ? { robots } : {}),
});
