import { getTranslations } from "next-intl/server";

import { InstallSheet } from "@/widgets/install-sheet";
import { AppMark } from "@/shared/ui/app-mark";
import { CenteredState } from "@/shared/ui/centered-state";
import { TextBlock } from "@/shared/ui/text-block";
import { InstallBrowserHint } from "./InstallBrowserHint";

// The /install page: iPhone, Safari, opened in a tab rather than from the
// home screen. LaunchGate sends people here when display-mode isn't
// standalone (ADR 0019).
//
// The footnote hint below is shown unconditionally, to everyone who
// reaches this screen — not only to people actually inside a messenger's
// in-app preview. That's not a missed opportunity to be precise: a
// Telegram/Slack/Discord/Reddit preview mostly opens through
// SFSafariViewController, Safari's own system component, whose UA is
// byte-identical to real Safari's (see classify-access.ts and ADR 0016)
// — there is no signal, server- or client-side, that tells the two
// cases apart. Showing the hint to everyone is the only way it reaches
// the people who need it.
export const InstallAppScreen = async () => {
  const t = await getTranslations("screens.installApp");

  return (
    <CenteredState
      fill
      glyph={<AppMark size={88} tone="solid" elevated />}
      actions={<InstallSheet />}
      footnote={<InstallBrowserHint>{t("inAppBrowserHint")}</InstallBrowserHint>}
    >
      <TextBlock align="center" eyebrow={t("eyebrow")} title={t("title")} text={t("text")} />
    </CenteredState>
  );
};
