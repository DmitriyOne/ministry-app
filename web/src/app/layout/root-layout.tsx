import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SerwistProvider } from "@serwist/turbopack/react";

import { BottomNav } from "@/widgets/bottom-nav";

import { Providers } from "./providers";

import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Ministry App",
  description: "Ministry App",
  manifest: "/manifest.webmanifest",
};

export function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
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
}
