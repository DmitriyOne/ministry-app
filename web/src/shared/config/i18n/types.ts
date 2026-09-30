import type { AppLocale } from "./locale";

import messages from "./messages/en-GB.json";

// next-intl typing (see ADR 0014): t("...") keys are checked by the
// compiler against the structure of en-GB.json — a missing/mistyped key
// fails `pnpm typecheck`, not just the runtime.
declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: typeof messages;
  }
}
