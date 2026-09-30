import { getTranslations } from "next-intl/server";

import { CopyLinkButton } from "@/features/copy-link";
import { AppMark } from "@/shared/ui/app-mark";
import { CenteredState } from "@/shared/ui/centered-state";
import { TextBlock } from "@/shared/ui/text-block";

// iPhone, but not Safari (ADR 0016) — rendered via a proxy.ts rewrite to
// /access/ios-browser. "Copy link" helps escape a messenger's in-app
// browser, where opening Safari with a single tap usually isn't possible.
export const IosBrowserRequiredScreen = async () => {
  const t = await getTranslations("screens.access.iosBrowser");

  return (
    <CenteredState
      glyph={<AppMark size={44} tone="solid" />}
      actions={
        <CopyLinkButton
          label={t("copyLinkButton")}
          copiedLabel={t("linkCopied")}
          errorLabel={t("copyLinkError")}
          addressLabel={t("addressLabel")}
        />
      }
    >
      <TextBlock align="center" title={t("title")} text={t("text")} titleSize="compact" />
    </CenteredState>
  );
};
