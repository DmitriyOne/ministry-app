import { getTranslations } from "next-intl/server";

import { FooterLink } from "./FooterLink";
import { footerLinks } from "../model/footer-links";

// A quiet footer, centred under a screen's content. Rendered by
// app/(with-footer)/layout.tsx on every screen in that group, which the
// owner narrowed to /soon and /install (ADR 0045, update): the screens
// someone reaches BEFORE signing in. Inside the app the same two links
// live on /profile, and /about and /privacy carry their own back button.
// The link to the page currently open renders as the active one instead
// of being omitted — see FooterLink, which is why that code is currently
// dormant: neither screen in the group is one the footer links to.
//
// Lives in widgets, not shared/ui: it knows the app's concrete routes
// and pulls its text from the domain dictionary, which is a business
// scenario, not "dumb" markup — the boundary shared/ui isn't meant to
// cross (see the root CLAUDE.md's "shared/ui boundary" rule). TextLink
// (shared/ui) stays there — it's the reusable, routeless, textless
// primitive this widget (via FooterLink) is built from.
//
// The link list lives in model/footer-links.ts (ADR 0030) — this
// component only renders it, so a second link is a model change, not a
// markup change. TextLink already handles client-side navigation for
// internal hrefs on its own (ADR 0024), so no per-link client wrapper
// is needed for navigation — FooterLink's own "use client" is only
// there for the active-link check (usePathname), not for navigation.
//
// A Server Component (getTranslations, not the useTranslations hook —
// no "use client" needed here, same split as ScreenHeader, ADR 0013's
// "use client" rule) — FooterLink is the one client leaf underneath it.
export const ScreenFooter = async () => {
  const t = await getTranslations("common");

  return (
    <footer className="flex justify-center gap-4 py-5">
      {footerLinks.map((link) => (
        <FooterLink key={link.href} href={link.href}>
          {t(link.labelKey)}
        </FooterLink>
      ))}
    </footer>
  );
};
