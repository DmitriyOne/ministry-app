import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getSiteUrl, locale } from "@/shared/config";

type BuildSocialMetadataInput = {
  title: string;
  description: string;
};

// The link-preview card, public/og-image.jpg. Width and height are the
// real pixel size of the file (a 2x capture of a 1200 x 630 card), not
// the nominal Open Graph size — the tags must describe the actual file.
const OG_IMAGE_PATH = "/og-image.jpg";
const OG_IMAGE_WIDTH = 2398;
const OG_IMAGE_HEIGHT = 1258;

// The single place that declares the Open Graph and Twitter/X card
// (ADR 0032). Next.js replaces `openGraph` and `twitter` wholesale per
// route segment instead of merging them, so this is called both by the
// root layout and by buildPageMetadata — never written out twice.
export const buildSocialMetadata = async ({
  title,
  description,
}: BuildSocialMetadataInput): Promise<Pick<Metadata, "openGraph" | "twitter">> => {
  const t = await getTranslations("metadata");
  // Without a known base URL the image is left out altogether. Next.js
  // cannot emit a relative og:image: for a relative path with no
  // metadataBase it silently falls back to http://localhost:3000 (plus a
  // build warning), which would ship a dead absolute URL to every
  // crawler. No image is better than a wrong one.
  const images = getSiteUrl()
    ? [
        {
          url: OG_IMAGE_PATH,
          width: OG_IMAGE_WIDTH,
          height: OG_IMAGE_HEIGHT,
          alt: t("ogImageAlt"),
        },
      ]
    : undefined;

  return {
    openGraph: {
      title,
      description,
      type: "website",
      // Open Graph wants the underscore form ("en_GB"), next-intl's
      // locale uses the BCP 47 hyphen form ("en-GB") — derived, not a
      // second hardcoded locale literal.
      locale: locale.replace("-", "_"),
      siteName: t("title"),
      images,
    },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title,
      description,
      images,
    },
  };
};
