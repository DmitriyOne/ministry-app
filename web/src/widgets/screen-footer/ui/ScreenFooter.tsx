import { getTranslations } from "next-intl/server";

import { TextLink } from "@/shared/ui/text-link";

import { footerLinks } from "../model/footer-links";

// A quiet footer, centred under a screen's content. Rendered by
// app/(with-footer)/layout.tsx on every screen in that group — day,
// soon, install, the root redirect — everywhere except /access/* (the
// person isn't getting into the app regardless, see ADR 0016) and /about
// itself (ADR 0029).
//
// Lives in widgets, not shared/ui: it knows the app's concrete routes
// and pulls its text from the domain dictionary, which is a business
// scenario, not "dumb" markup — the boundary shared/ui isn't meant to
// cross (see the root CLAUDE.md's "shared/ui boundary" rule). TextLink
// (shared/ui) stays there — it's the reusable, routeless, textless
// primitive this widget is built from.
//
// The link list lives in model/footer-links.ts (ADR 0030) — this
// component only renders it, so a second link is a model change, not a
// markup change. TextLink already handles client-side navigation for
// internal hrefs on its own (ADR 0024), so no per-link client wrapper
// (the previous AboutLink) is needed any more — see
// features/screen-back for how "back" navigation off /about works now.
//
// A Server Component (getTranslations, not the useTranslations hook —
// no "use client" needed here, same split as ScreenHeader, ADR 0013's
// "use client" rule).
export const ScreenFooter = async () => {
  const t = await getTranslations("common");

  return (
    <footer className="flex justify-center gap-4 py-5">
      {footerLinks.map((link) => (
        <TextLink key={link.href} href={link.href}>
          {t(link.labelKey)}
        </TextLink>
      ))}
    </footer>
  );
};
