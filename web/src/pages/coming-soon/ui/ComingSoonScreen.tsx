import { getTranslations } from "next-intl/server";

import { WaitlistForm } from "@/widgets/waitlist-form";
import { AppMark } from "@/shared/ui/app-mark";
import { CenteredState } from "@/shared/ui/centered-state";
import { TextBlock } from "@/shared/ui/text-block";

// The /soon page. Until v2 this was where the installed app landed while
// LAUNCH_MODE was "coming-soon", and web/proxy.ts rewrote /day to it.
// That switch is gone (ADR 0045): /soon is now the public landing page,
// open in an ordinary Safari tab and no longer behind LaunchGate, which
// is the only thing that keeps the waitlist form reachable at all.
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
