import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import { getTranslations } from "next-intl/server";

import { LaunchGate, LaunchLoading, LaunchNoscriptFallback } from "@/features/launch-gate";
import { env, getSiteUrl, locale } from "@/shared/config";

import { Providers } from "./providers";

import "../styles/globals.css";

// No next/font/google — the font is set in styles/globals.css, see ADR 0011.

// Text comes from the dictionary (ADR 0014), so metadata is built via
// generateMetadata rather than a static export — next-intl only hands
// back translations asynchronously.
//
// title.template (ADR 0032) appends the product name once, consistently
// — every screen's own generateMetadata (shared/lib/metadata/
// build-page-metadata.ts) sets a short title, this template does the
// " — MinistryApp" suffix, nowhere else. title.default/metadataT("title")
// is what the root `/` route falls back to (it has no metadata of its
// own — see app/(with-footer)/page.tsx, it only redirects) and is also
// title.absolute-equivalent here (no page.tsx defines metadata.title
// without going through buildPageMetadata, so the template always
// applies below the root).
//
// icons.apple was removed (ADR 0020 → ADR 0032): web/app/apple-icon.png
// (the file-based convention) now supersedes it — file-based metadata
// always wins over the generateMetadata/metadata object (see Next.js
// docs, generate-metadata.md: "File-based metadata has the higher
// priority"), so keeping both was redundant, not additive.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("metadata");
  const siteUrl = getSiteUrl();

  return {
    title: { default: t("title"), template: `%s — ${t("title")}` },
    description: t("description"),
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: t("title") },
    openGraph: {
      type: "website",
      // Open Graph's underscore form, derived from next-intl's
      // hyphenated locale — see shared/lib/metadata/build-page-metadata.ts
      // for the same derivation used by every screen below this layout.
      locale: locale.replace("-", "_"),
      siteName: t("title"),
    },
  };
};

// viewport-fit=cover — without it, safe-area content (the --hero
// background across the full screen, buttons on rounded corners) ignores
// the notch/home indicator on iPhone. themeColor colours the Safari/PWA
// status bar (ADR 0020).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1e4a40",
};

type RootLayoutProps = {
  children: ReactNode;
};

// Which screen to show (Coming soon/install/app/device placeholder) is
// decided in web/proxy.ts (ADR 0017) — nothing to do with this file.
// Whether it's SAFE to show yet (launched from the home-screen icon or
// not) is decided by LaunchGate (features/launch-gate, ADR
// 0017/0019/0028), a client component: skipped entirely under
// env.DEV_MODE (server-only, ADR 0016/0017) so local development gets
// direct, instant access with no gate and no loading flash — the
// "DEV_MODE=true" row of the access table in CLAUDE.md.
// suppressHydrationWarning on <html> only suppresses React's mismatch
// warning for attributes on this one element — it does not extend to its
// subtree, and it does not stop React from still rendering the
// server-sent markup on hydration (React docs: "the mismatch warning...
// will be skipped"; children below are unaffected either way). That
// scope is exactly right here: the mismatch is a browser extension
// injecting its own attribute onto <html> after the server response is
// generated (e.g. `__gcrremoteframetoken` — not emitted by any code in
// this repo, confirmed by grepping the codebase), which is real,
// harmless, and unfixable from application code — no prop this app
// controls can predict what a given visitor's extensions will add.
// Suppressing it here does NOT hide a genuine mismatch anywhere else in
// the tree; a real one (e.g. in body's children) would still warn.
export const RootLayout = ({ children }: RootLayoutProps) => (
  <html lang={locale} className="h-full antialiased" suppressHydrationWarning>
    <body className="min-h-full flex flex-col">
      <LaunchNoscriptFallback />
      <SerwistProvider swUrl="/serwist/sw.js" disable={process.env.NODE_ENV === "development"}>
        {env.DEV_MODE ? (
          <Providers>
            <div className="flex min-h-full flex-1 flex-col">{children}</div>
          </Providers>
        ) : (
          <LaunchGate loading={<LaunchLoading />}>
            <Providers>{children}</Providers>
          </LaunchGate>
        )}
      </SerwistProvider>
    </body>
  </html>
);
