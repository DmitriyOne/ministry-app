import { getTranslations } from "next-intl/server";

// The only fallback LaunchGate needs for a no-JS visitor. LaunchGate is a
// client component: without JavaScript it never mounts as far as the
// browser's own execution is concerned — React still server-renders its
// *initial* state into the HTML (phase="loading"), but nothing ever
// moves it past that, since the effects that would never run. A no-JS
// visitor is left looking at the loading overlay forever, with the real
// page content never having been rendered into the document at all (not
// hidden — genuinely absent, see LaunchGate). This is an accepted
// regression against the previous CSS/`<noscript>`-override mechanism,
// which could reveal statically-rendered content immediately without JS —
// see ADR 0019 ("Обновление: state вместо CSS-оверлея") for why the
// trade-off was made anyway. <noscript> is the only way to react to this
// purely through markup — this renders a short, honest explanation
// instead of leaving a no-JS visitor staring at a spinner that will never
// resolve.
export const LaunchNoscriptFallback = async () => {
  const t = await getTranslations("common");

  return (
    <noscript>
      <p
        role="alert"
        className="fixed inset-x-0 bottom-0 z-[60] bg-background p-4 text-center text-caption text-ink-muted"
      >
        {t("noscriptRequired")}
      </p>
    </noscript>
  );
};
