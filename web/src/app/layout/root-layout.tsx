import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";
import { getTranslations } from "next-intl/server";

import { BottomNav } from "@/widgets/bottom-nav";
import { locale } from "@/shared/config";

import { Providers } from "./providers";

import "../styles/globals.css";

// Без next/font/google — шрифт задан в styles/globals.css, см. ADR 0011.

// Текст берётся из словаря (ADR 0014), поэтому metadata собирается через
// generateMetadata, а не статический export — next-intl отдаёт переводы
// только асинхронно.
export const generateMetadata = async (): Promise<Metadata> => {
  const t = await getTranslations("metadata");

  return {
    title: t("title"),
    description: t("description"),
    manifest: "/manifest.webmanifest",
  };
};

type RootLayoutProps = {
  children: ReactNode;
};

export const RootLayout = ({ children }: RootLayoutProps) => (
    <html lang={locale} className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <SerwistProvider
          swUrl="/serwist/sw.js"
          disable={process.env.NODE_ENV === "development"}
        >
          <Providers>
            <div className="flex flex-1 flex-col">{children}</div>
            <BottomNav />
          </Providers>
        </SerwistProvider>
      </body>
    </html>
  );
