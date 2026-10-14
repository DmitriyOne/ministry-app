"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { PasswordField } from "@/entities/password-field";
import { useSignIn } from "@/features/sign-in";
import { routes } from "@/shared/config";
import { BodyText } from "@/shared/ui/body-text";
import { ActionForm } from "@/shared/ui/action-form";
import { LinkButton } from "@/shared/ui/button";
import { CardTextField } from "@/shared/ui/card-text-field";
import { FieldCard } from "@/shared/ui/field-card";
import { InlineError } from "@/shared/ui/inline-error";
import { SubmitButton } from "@/shared/ui/submit-button";

// Same split as widgets/waitlist-form: the block that wires a feature's
// hook to shared controls is a widget, and the screen in pages/ only
// places it. What the form does — the schema, the action, the redirect —
// stays in features/sign-in, and the screen no longer imports
// react-hook-form at all.
export const SignInForm = () => {
  const t = useTranslations("screens.login");
  const { control, onSubmit, hasErrors, isPending, formError } = useSignIn();

  return (
    <ActionForm onSubmit={onSubmit}>
      <FieldCard>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <CardTextField
              {...field}
              label={t("emailLabel")}
              placeholder={t("emailPlaceholder")}
              type="email"
              inputMode="email"
              autoComplete="email"
              errors={fieldState.error && [fieldState.error]}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordField
              {...field}
              label={t("passwordLabel")}
              placeholder={t("passwordPlaceholder")}
              autoComplete="current-password"
              errors={fieldState.error && [fieldState.error]}
            />
          )}
        />
      </FieldCard>

      {formError ? <InlineError>{formError}</InlineError> : null}

      <SubmitButton isPending={isPending} isBlocked={hasErrors}>
        {t("submit")}
      </SubmitButton>
      <LinkButton href={routes.forgotPassword} variant="heroGhost" size="role">
        {t("forgotPassword")}
      </LinkButton>
      <BodyText tone="hero" className="px-3 pt-1.5 text-center text-caption text-hero-foreground/40">
        {t("footnote")}
      </BodyText>
    </ActionForm>
  );
};
