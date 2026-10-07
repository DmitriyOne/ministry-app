import { getTranslations } from "next-intl/server";

import { AppMark } from "@/shared/ui/app-mark";
import { BodyText } from "@/shared/ui/body-text";
import { CenteredState } from "@/shared/ui/centered-state";
import { Title } from "@/shared/ui/title";
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
          screen's <main>, and this block is the screen's own title, not a
          banner landmark. CLAUDE.md reserves <header> for navigation. */}
      <div className="flex flex-col gap-3.5 px-2">
        <AppMark size={56} tone="translucent" />
        <div className="flex flex-col gap-2">
          <Title tone="hero">{t("title")}</Title>
          <BodyText tone="hero">{t("subtitle")}</BodyText>
        </div>
      </div>

      <SignInForm />
    </CenteredState>
  );
};
