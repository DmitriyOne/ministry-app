import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";

import { ToastProvider } from "@/shared/ui/toast";

type ProvidersProps = {
  children: ReactNode;
};

// With no i18n routing (ADR 0014), next-intl reads locale and messages
// from request.ts on its own — NextIntlClientProvider with no props
// picks up the same values, making them available to client components
// (useTranslations). ToastProvider sits inside it because callers pass
// already-translated text.
export const Providers = ({ children }: ProvidersProps) => (
  <NextIntlClientProvider>
    <ToastProvider>{children}</ToastProvider>
  </NextIntlClientProvider>
);
