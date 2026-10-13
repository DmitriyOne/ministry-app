import { getTranslations } from "next-intl/server";

import { Spinner } from "@/shared/ui/spinner";

// The waiting indicator for the first connectivity probe (NetworkGate's
// `checking` state). A spinner, deliberately — this is the one place in
// the app that really is waiting on a reply that may never come: the probe
// has a 5 second timeout (NETWORK_CONFIG) and repeats while offline.
//
// It used to share LaunchLoading with the launch splash. The two states
// then stopped being interchangeable: the splash became a brand mark with
// no motion in it (ADR 0019, update), which over five seconds of silence
// would look like a frozen app rather than a wait. Two states that mean
// different things get to look different.
//
// A server component for the same reason LaunchLoading is one — it reads
// its string via getTranslations, and NetworkGate, being a client
// component, takes the result as a prop.
export const NetworkChecking = async () => {
  const t = await getTranslations("common");

  return (
    <>
      <Spinner className="size-8 text-primary" />
      <p className="text-caption font-540 text-ink-muted">{t("loading")}</p>
    </>
  );
};
