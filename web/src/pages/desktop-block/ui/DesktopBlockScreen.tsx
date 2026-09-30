import { getTranslations } from "next-intl/server";

import { AppMark } from "@/shared/ui/app-mark";
import { CenteredState } from "@/shared/ui/centered-state";
import { TextBlock } from "@/shared/ui/text-block";

// A placeholder for desktop, laptop and any tablet, including an iPad
// with a macOS UA (ADR 0016). Rendered via a proxy.ts rewrite to
// /access/desktop — the page itself knows nothing about the device, it
// just renders text.
export const DesktopBlockScreen = async () => {
  const t = await getTranslations("screens.access.desktop");

  return (
    <CenteredState glyph={<AppMark size={44} tone="solid" />}>
      <TextBlock align="center" title={t("title")} text={t("text")} titleSize="compact" />
    </CenteredState>
  );
};
