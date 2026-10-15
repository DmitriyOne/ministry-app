import { getTranslations } from "next-intl/server";

import { AppMark } from "@/shared/ui/app-mark";

// Just the overlay's content (the mark + the app's name) — the overlay's
// chrome (fixed positioning, z-index, background, role="status", the exit
// transition) belongs to LaunchGate (launch-gate.tsx), which owns the
// overlay's whole lifecycle, mount to unmount. This component stays a
// server component only for that reason: it reads its strings via
// getTranslations and hands the result to LaunchGate as a prop.
//
// No spinner (ADR 0019, update): a spinner means "wait", and nothing is
// being waited for — the launch decision resolves in a microtask. What is
// happening is the app opening, which is what a brand mark says. There is
// no waiting screen anywhere else either: the connectivity probe no longer
// holds the app back while it runs (ADR 0055).
//
// The same glyph as /install and /soon (AppMark 88, solid, elevated), not
// a splash-only variant: this is the first thing seen on every launch, and
// a second mark that differed slightly would read as a different app.
export const LaunchLoading = async () => {
  const t = await getTranslations("common");

  return (
    <>
      <AppMark size={88} tone="solid" elevated className="shell-mark" />
      {/*
        * aria-hidden with an sr-only sibling below, rather than left to be
        * announced: visually this is a brand splash, but the element it
        * sits in is a role="status" live region, and "MinistryApp" is not a
        * status. Assistive tech gets the word that describes the moment.
        */}
      <p aria-hidden="true" className="shell-wordmark text-list-row font-620 tracking-tight text-ink">
        {t("appName")}
      </p>
      <span className="sr-only">{t("loading")}</span>
    </>
  );
};
