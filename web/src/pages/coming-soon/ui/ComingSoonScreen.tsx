import { getTranslations } from "next-intl/server";

import { WaitlistForm } from "@/widgets/waitlist-form";
import { AppMark } from "@/shared/ui/app-mark";
import { CenteredState } from "@/shared/ui/centered-state";
import { TextBlock } from "@/shared/ui/text-block";

// The /soon page — the installed app lands here while LAUNCH_MODE
// (app layer, web/src/app/config/launch-mode.ts) is "coming-soon";
// web/proxy.ts picks /soon or /day from the same value (ADR 0016/0017).
export const ComingSoonScreen = async () => {
  const t = await getTranslations("screens.comingSoon");

  return (
    <CenteredState fill glyph={<AppMark size={88} tone="solid" elevated />} actions={<WaitlistForm />}>
      <TextBlock
        align="center"
        eyebrow={t("eyebrow")}
        title={t("title")}
        text={t("text")}
      />
    </CenteredState>
  );
};
