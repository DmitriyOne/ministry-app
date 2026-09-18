import type { ReactNode } from "react";
import type { Metadata } from "next";
import { SerwistProvider } from "@serwist/turbopack/react";

import { BottomNav } from "@/widgets/bottom-nav";

import { Providers } from "./providers";

import "../styles/globals.css";

// Без next/font/google — шрифт задан в styles/globals.css, см. ADR 0011.

export const metadata: Metadata = {
  title: "Учёт служения",
  description: "Учёт часов служения для пионеров и возвещателей",
  manifest: "/manifest.webmanifest",
};

type RootLayoutProps = {
  children: ReactNode;
};

export const RootLayout = ({ children }: RootLayoutProps) => (
    <html lang="ru" className="h-full antialiased">
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
