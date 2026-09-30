"use client";

import { useEffect } from "react";

import messages from "@/shared/config/i18n/messages/en-GB.json";

import "@/app/styles/globals.css";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

// Fires when the root layout itself crashes — providers (including
// NextIntlClientProvider) may not have run, so text is read straight from
// the JSON dictionary rather than via useTranslations, and shared/ui isn't
// used (it wraps itself in the providers). html/body are hand-rolled —
// global-error replaces the whole layout, it doesn't render inside it.
const t = messages.screens.globalError;

const GlobalError = ({ error, reset }: GlobalErrorProps) => {
  useEffect(() => {
    console.error("[global-error]", error);
  }, [error]);

  return (
    <html lang="en-GB">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background px-8 py-10 text-center text-ink">
        <div className="flex size-26 items-center justify-center rounded-full bg-negative/10 text-status font-620 tracking-screen-title text-negative">
          {t.code}
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-title font-640 tracking-screen-title">{t.title}</h1>
          <p className="text-body font-500 text-ink-muted">{t.text}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="h-[50px] w-full max-w-65 rounded-button bg-negative px-6 text-base font-580 text-negative-foreground"
        >
          {t.retryButton}
        </button>
      </body>
    </html>
  );
};

export default GlobalError;
