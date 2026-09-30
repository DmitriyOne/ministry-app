import { getTranslations } from "next-intl/server";

import { Spinner } from "@/shared/ui/spinner";

// Just the overlay's content (spinner + text) — the overlay's chrome
// (fixed positioning, z-index, background, role="status", the exit
// transition) belongs to LaunchGate (launch-gate.tsx), which owns the
// overlay's whole lifecycle, mount to unmount. This component stays a
// server component only for that reason: it reads the "loading" string
// via getTranslations and hands the result to LaunchGate as a prop.
export const LaunchLoading = async () => {
  const t = await getTranslations("common");

  return (
    <>
      <Spinner className="size-8 text-primary" />
      <p className="text-caption font-540 text-ink-muted">{t("loading")}</p>
    </>
  );
};
