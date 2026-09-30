import { getTranslations } from "next-intl/server";

import { AppMark } from "@/shared/ui/app-mark";
import { CenteredState } from "@/shared/ui/centered-state";
import { TextBlock } from "@/shared/ui/text-block";

// Android is blocked in v1 (ADR 0016) — rendered via a proxy.ts rewrite
// to /access/android.
export const AndroidBlockScreen = async () => {
  const t = await getTranslations("screens.access.android");

  return (
    <CenteredState glyph={<AppMark size={44} tone="solid" />}>
      <TextBlock align="center" title={t("title")} text={t("text")} titleSize="compact" />
    </CenteredState>
  );
};
