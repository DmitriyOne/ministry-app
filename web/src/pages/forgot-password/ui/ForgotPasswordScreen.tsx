import { getTranslations } from "next-intl/server";

import { RecheckGateOnRestore } from "@/features/gate-recheck";
import { ScreenBackHeader } from "@/features/screen-back";
import { CenteredState } from "@/shared/ui/centered-state";
import { ScreenIntro } from "@/shared/ui/screen-intro";
import { PasswordResetForm } from "@/widgets/password-reset-form";

// Deliberately the same frame as LoginScreen: the two screens are one
// step apart, and the form is the only client island on either.
//
// The header is a sibling of <main>, not a child of it — one <main> per
// screen, navigation in <header> (CLAUDE.md). That is also why the deep
// background and the full height live on the wrapper: CenteredState gets
// `fill` and takes only the space left under the header, the way the
// screens inside (with-footer) do (ADR 0029).
export const ForgotPasswordScreen = async () => {
  const t = await getTranslations("screens.forgotPassword");

  return (
    <div className="flex min-h-app flex-col bg-hero text-hero-foreground">
      {/* The same back scenario the about and privacy screens use: go
          back in history if there is anywhere to go, otherwise a full
          navigation to "/" — which, with no session, the proxy sends on
          to /login, exactly where this screen's back belongs. The padding
          adds the iOS safe-area inset on top of the header's own pt-6, so
          the button never sits under the status bar (viewport-fit=cover,
          ADR 0020). */}
      <ScreenBackHeader
        tone="hero"
        eyebrow={t("eyebrow")}
        className="pt-screen-header"
      />

      <CenteredState
        fill
        background="deep"
        className="items-stretch justify-between gap-8 px-6 pt-10 pb-10 text-left"
      >
        <ScreenIntro title={t("title")} text={t("subtitle")} />

        <PasswordResetForm />

        {/* Same reason as on the login screen: a page the browser brings
            back from its cache has to be re-checked against the session. */}
        <RecheckGateOnRestore />
      </CenteredState>
    </div>
  );
};
