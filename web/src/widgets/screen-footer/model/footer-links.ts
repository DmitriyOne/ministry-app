import type { getTranslations } from "next-intl/server";

import { routes, type AppRoute } from "@/shared/config";

// Key type derived from the actual translator, not hand-typed — stays in
// sync with en-GB.json's "common" namespace without a second source of
// truth (ADR 0014's typed-dictionary mechanism already enforces this at
// the call site in ui/ScreenFooter.tsx).
type CommonTranslator = Awaited<ReturnType<typeof getTranslations<"common">>>;
type CommonMessageKey = Parameters<CommonTranslator>[0];

export type FooterLink = {
  href: AppRoute;
  labelKey: CommonMessageKey;
};

// The list ScreenFooter renders. Adding a second link (there's only one
// today) means adding an entry here, not touching ui/ScreenFooter.tsx.
export const footerLinks: FooterLink[] = [{ href: routes.about, labelKey: "aboutLink" }];
