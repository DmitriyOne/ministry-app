import { getTranslations } from "next-intl/server";

import { AppMark } from "@/shared/ui/app-mark";
import { BodyText } from "@/shared/ui/body-text";
import { CenteredState } from "@/shared/ui/centered-state";
import { Title } from "@/shared/ui/title";
import { PasswordResetForm } from "@/widgets/password-reset-form";

// Deliberately the same frame as LoginScreen: the two screens are one
// step apart, and the form is the only client island on either.
export const ForgotPasswordScreen = async () => {
  const t = await getTranslations("screens.forgotPassword");

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

      <PasswordResetForm />
    </CenteredState>
  );
};
