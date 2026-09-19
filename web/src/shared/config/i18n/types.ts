import type { AppLocale } from "./locale";

import messages from "./messages/ru.json";

// Типизация next-intl (см. ADR 0014): ключи t("...") проверяются
// компилятором по структуре ru.json — несуществующий/опечатанный ключ
// ломает `pnpm typecheck`, не только рантайм.
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
