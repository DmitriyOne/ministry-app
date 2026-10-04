import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";

type ProvidersProps = {
  children: ReactNode;
};

// With no i18n routing (ADR 0014), next-intl reads locale and messages
// from request.ts on its own — NextIntlClientProvider with no props
// picks up the same values, making them available to client components
// (useTranslations).
export const Providers = ({ children }: ProvidersProps) => (
  <NextIntlClientProvider>{children}</NextIntlClientProvider>
);
