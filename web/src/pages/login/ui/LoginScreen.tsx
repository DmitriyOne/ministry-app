import { getTranslations } from "next-intl/server";

import { RecheckGateOnRestore } from "@/features/gate-recheck";
import { CenteredState } from "@/shared/ui/centered-state";
import { ScreenIntro } from "@/shared/ui/screen-intro";
import { SignInForm } from "@/widgets/sign-in-form";

// Same shape as ComingSoonScreen: the screen is a Server Component and the
// only client island on it is the form widget. It stopped being "use
// client" when the form moved out — nothing left here has state.
export const LoginScreen = async () => {
  const t = await getTranslations("screens.login");

  return (
    <CenteredState
      background="deep"
      className="items-stretch justify-between gap-8 px-6 pt-24 pb-10 text-left"
    >
      {/* A plain div, not <header>: CenteredState already provides the
          screen's <main>, and ScreenIntro is the screen's own title, not a
          banner landmark. CLAUDE.md reserves <header> for navigation. */}
      <ScreenIntro title={t("title")} text={t("subtitle")} />

      <SignInForm />

      {/* Renders nothing: if the browser brings this page back from its own
          cache after a sign-in, it asks the server again — and the proxy,
          seeing a session, sends the person on to /day. */}
      <RecheckGateOnRestore />
    </CenteredState>
  );
};
