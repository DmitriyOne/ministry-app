import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import { getTranslations } from "next-intl/server";

import { LaunchGate, LaunchLoading, LaunchNoscriptFallback } from "@/features/launch-gate";
import { env, locale } from "@/shared/config";

import { Providers } from "./providers";

import "../styles/globals.css";

// No next/font/google — the font is set in styles/globals.css, see ADR 0011.

// Text comes from the dictionary (ADR 0014), so metadata is built via
// generateMetadata rather than a static export — next-intl only hands
// back translations asynchronously.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("metadata");

  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, statusBarStyle: "default", title: t("title") },
    icons: { apple: "/icons/icon-192.png" },
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
