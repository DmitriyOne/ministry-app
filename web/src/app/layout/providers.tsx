import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";

type ProvidersProps = {
  children: ReactNode;
};

// Без i18n-роутинга (ADR 0014) локаль и messages next-intl берёт из
// request.ts сам — NextIntlClientProvider без пропов подхватывает их же,
// делая доступными клиентским компонентам (useTranslations).
export const Providers = ({ children }: ProvidersProps) => (
  <NextIntlClientProvider>{children}</NextIntlClientProvider>
);
