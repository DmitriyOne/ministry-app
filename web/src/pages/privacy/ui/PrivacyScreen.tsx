import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";

import { ScreenBackHeader } from "@/features/screen-back";
import { BodyText } from "@/shared/ui/body-text";
import { Caption } from "@/shared/ui/caption";
import { CookieTable } from "@/shared/ui/cookie-table";
import { NumberedSection } from "@/shared/ui/numbered-section";
import { SectionIndex } from "@/shared/ui/section-index";
import { Title } from "@/shared/ui/title";

// A styled <strong> for the bold legal terms t.rich pulls out of the
// copy ("special category of personal data", "Legal basis...", etc.) —
// semantic emphasis, not the coloured-span treatment About's <mail>
// chunk uses (ADR 0029 decision 4) for a contact detail; a different
// visual intent, same t.rich mechanism.
const bold = (chunks: ReactNode) => <strong className="font-600 text-ink">{chunks}</strong>;
// Same styled-text-not-link treatment ADR 0029 gives the About screen's
// email address — an address you're told, not meant to be tapped.
const mail = (chunks: ReactNode) => <span className="text-primary">{chunks}</span>;

const listItemClassName = "text-body font-500 text-pretty text-ink-muted";
const paragraphClassName = "text-body font-500 text-pretty text-ink-muted";

// /privacy — a single scrolling, numbered-document screen covering what
// MinistryApp stores, why, the one cookie it sets, who can see the data,
// a person's rights, and how to contact the controller. Reached only
// from the footer (ScreenFooter, widgets/screen-footer), same as
// /about; never part of the launch flow itself (ADR 0031, extending ADR
// 0029's reasoning for /about not being in LaunchGate's
// APP_SCREEN_PATHS).
export const PrivacyScreen = async () => {
  const t = await getTranslations("screens.privacy");

  const tocItems = [
    { href: "#what-we-store", label: t("toc.whatWeStore") },
    { href: "#why", label: t("toc.why") },
    { href: "#cookies", label: t("toc.cookies") },
    { href: "#who-can-see-it", label: t("toc.whoCanSeeIt") },
    { href: "#your-rights", label: t("toc.yourRights") },
    { href: "#contact", label: t("toc.contact") },
  ];

  return (
    // `min-h-dvh` again: this screen left app/(with-footer) when the
    // footer was narrowed to /soon and /install (ADR 0029, amendment
    // 2026-10-08), so nothing above it reserves the viewport height any
    // more and it has to claim it itself — otherwise short content would
    // leave a pale strip of the page's background below it. The <main>
    // inside keeps `flex-1` and grows past that on long content, so the
    // document scrolls exactly as before.
    <div className="flex min-h-dvh flex-col bg-background text-ink">
      {/* The DOCUMENT is the scroll container here (no overflow-y-auto
          on <main> below), so `sticky` on this header is real: it pins
          to the top of the viewport as the page scrolls underneath it,
          not a no-op. (ADR 0031 originally removed `sticky` from this
          same header for the opposite — inner-scroll — layout; its
          amendment explains why it's back.) `bg-background` keeps
          content from showing through as it slides under the header;
          the padding-top override below adds the iOS safe-area inset
          (notch/status bar, `viewport-fit=cover` — ADR 0020) on top of
          the header's own `pt-6`, so the back button never sits under
          the status bar.
          Same classes as the About screen — kept identical rather than
          factored into ScreenBackHeader itself, because not every
          future caller of that component will want a sticky header. */}
      <ScreenBackHeader
        eyebrow={t("eyebrow")}
        className="screen-header-sticky"
      />

      <main className="flex flex-1 flex-col gap-5 px-5 pt-1.5 pb-10">
        <div className="flex flex-col gap-1.5">
          <Title>{t("title")}</Title>
          <Caption>{t("updated")}</Caption>
        </div>

        <BodyText>{t("intro")}</BodyText>

        <SectionIndex items={tocItems} />

        <NumberedSection id="what-we-store" number={1} title={t("sections.whatWeStore.heading")}>
          <p className={paragraphClassName}>{t("sections.whatWeStore.intro")}</p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li className={listItemClassName}>{t("sections.whatWeStore.items.item1")}</li>
            <li className={listItemClassName}>{t("sections.whatWeStore.items.item2")}</li>
            <li className={listItemClassName}>{t("sections.whatWeStore.items.item3")}</li>
            <li className={listItemClassName}>{t("sections.whatWeStore.items.item4")}</li>
            <li className={listItemClassName}>{t("sections.whatWeStore.items.item5")}</li>
          </ul>
          <p className={paragraphClassName}>{t("sections.whatWeStore.retention")}</p>
        </NumberedSection>

        <NumberedSection id="why" number={2} title={t("sections.why.heading")}>
          <p className={paragraphClassName}>{t("sections.why.intro")}</p>
          <p className={paragraphClassName}>{t("sections.why.waitlist")}</p>
          <p className={paragraphClassName}>{t("sections.why.pushNotifications")}</p>
          <p className={paragraphClassName}>{t.rich("sections.why.specialCategory", { b: bold })}</p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li className={listItemClassName}>{t.rich("sections.why.legalBasis", { b: bold })}</li>
            <li className={listItemClassName}>
              {t.rich("sections.why.specialCategoryCondition", { b: bold })}
            </li>
          </ul>
          <p className={paragraphClassName}>{t("sections.why.withdraw")}</p>
          <p className={paragraphClassName}>{t("sections.why.noProfiling")}</p>
        </NumberedSection>

        <NumberedSection id="cookies" number={3} title={t("sections.cookies.heading")}>
          <p className={paragraphClassName}>{t("sections.cookies.intro")}</p>
          <CookieTable
            caption={t("sections.cookies.table.caption")}
            headings={{
              name: t("sections.cookies.table.name"),
              purpose: t("sections.cookies.table.purpose"),
              type: t("sections.cookies.table.type"),
            }}
            rows={[
              {
                id: "auth",
                name: t("sections.cookies.table.rows.auth.name"),
                purpose: t("sections.cookies.table.rows.auth.purpose"),
                type: t("sections.cookies.table.rows.auth.type"),
                status: "positive",
                statusLabel: t("sections.cookies.table.rows.auth.statusLabel"),
              },
              {
                id: "offline",
                name: t("sections.cookies.table.rows.offline.name"),
                purpose: t("sections.cookies.table.rows.offline.purpose"),
                type: t("sections.cookies.table.rows.offline.type"),
                status: "positive",
                statusLabel: t("sections.cookies.table.rows.offline.statusLabel"),
              },
              {
                id: "analytics",
                name: t("sections.cookies.table.rows.analytics.name"),
                purpose: t("sections.cookies.table.rows.analytics.purpose"),
                type: t("sections.cookies.table.rows.analytics.type"),
                status: "negative",
                statusLabel: t("sections.cookies.table.rows.analytics.statusLabel"),
              },
            ]}
          />
        </NumberedSection>

        <NumberedSection id="who-can-see-it" number={4} title={t("sections.whoCanSeeIt.heading")}>
          <p className={paragraphClassName}>{t("sections.whoCanSeeIt.intro")}</p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li className={listItemClassName}>{t.rich("sections.whoCanSeeIt.items.you", { b: bold })}</li>
            <li className={listItemClassName}>
              {t.rich("sections.whoCanSeeIt.items.superAdmin", { b: bold })}
            </li>
          </ul>
          <p className={paragraphClassName}>{t("sections.whoCanSeeIt.subProcessorsIntro")}</p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li className={listItemClassName}>
              {t.rich("sections.whoCanSeeIt.subProcessors.supabase", { b: bold })}
            </li>
            <li className={listItemClassName}>
              {t.rich("sections.whoCanSeeIt.subProcessors.vercel", { b: bold })}
            </li>
            <li className={listItemClassName}>
              {t.rich("sections.whoCanSeeIt.subProcessors.sentry", { b: bold })}
            </li>
          </ul>
          <p className={paragraphClassName}>{t("sections.whoCanSeeIt.dataStaysInUk")}</p>
        </NumberedSection>

        <NumberedSection id="your-rights" number={5} title={t("sections.yourRights.heading")}>
          <p className={paragraphClassName}>{t("sections.yourRights.intro")}</p>
          <ul className="flex list-disc flex-col gap-1.5 pl-5">
            <li className={listItemClassName}>{t.rich("sections.yourRights.items.access", { b: bold })}</li>
            <li className={listItemClassName}>{t.rich("sections.yourRights.items.correct", { b: bold })}</li>
            <li className={listItemClassName}>{t.rich("sections.yourRights.items.erase", { b: bold })}</li>
            <li className={listItemClassName}>{t.rich("sections.yourRights.items.restrict", { b: bold })}</li>
            <li className={listItemClassName}>
              {t.rich("sections.yourRights.items.receiveCopy", { b: bold })}
            </li>
            <li className={listItemClassName}>
              {t.rich("sections.yourRights.items.withdrawConsent", { b: bold })}
            </li>
            <li className={listItemClassName}>
              {t.rich("sections.yourRights.items.complain", { b: bold })}
            </li>
          </ul>
          <p className={paragraphClassName}>{t.rich("sections.yourRights.contactLine", { mail })}</p>
        </NumberedSection>

        <NumberedSection id="contact" number={6} title={t("sections.contact.heading")}>
          <p className={paragraphClassName}>
            <span className="font-600 text-ink">{t("sections.contact.controllerLabel")}</span>
            {" "}
            {t("sections.contact.controllerName")}
          </p>
          <p className={paragraphClassName}>
            <span className="font-600 text-ink">{t("sections.contact.icoLabel")}</span>
            {" "}
            {t("sections.contact.icoValue")}
          </p>
          <p className={paragraphClassName}>
            <span className="font-600 text-ink">{t("sections.contact.emailLabel")}</span>
            {" "}
            {t("sections.contact.emailValue")}
          </p>
          {/* No postal address — email-only contact is a deliberate
              controller decision (ADR 0031): publishing an individual's
              home address is a disproportionate privacy cost, and a
              working contact channel (this email) already satisfies
              Article 13(1)(b)'s "contact details" requirement. */}
          <p className={paragraphClassName}>{t("sections.contact.noDpo")}</p>
        </NumberedSection>
      </main>
    </div>
  );
};
