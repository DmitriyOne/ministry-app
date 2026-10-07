"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { useRequestPasswordReset } from "@/features/request-password-reset";
import { routes } from "@/shared/config";
import { BodyText } from "@/shared/ui/body-text";
import { Button, LinkButton } from "@/shared/ui/button";
import { CARD_FIELD_CONTROL_CLASS, CardField } from "@/shared/ui/card-field";
import { FieldCard } from "@/shared/ui/field-card";
import { InputGroupInput } from "@/shared/ui/input-group";
import { Spinner } from "@/shared/ui/spinner";

// The same split as widgets/sign-in-form: this block wires the feature's
// hook to shared controls, the screen only places it.
export const PasswordResetForm = () => {
  const t = useTranslations("screens.forgotPassword");
  const { control, onSubmit, hasErrors, isPending, isSent } = useRequestPasswordReset();

  // One state replaces the form, as on the waitlist screen. The text says
  // nothing about whether that address has an account — the action is
  // deliberately unable to tell, and saying "no such account" here is
  // exactly what would make the page a way to find out.
  if (isSent) {
    return (
      <div className="flex flex-col gap-3.5">
        <BodyText tone="hero">{t("sent")}</BodyText>
        <LinkButton href={routes.login} variant="action" size="role-lg">
          {t("backToSignIn")}
        </LinkButton>
      </div>
    );
  }

  return (
    <form
      noValidate
      className="flex flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <FieldCard>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <CardField label={t("emailLabel")} errors={fieldState.error && [fieldState.error]}>
              {({ id, describedBy, isInvalid }) => (
                <InputGroupInput
                  {...field}
                  id={id}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  aria-invalid={isInvalid || undefined}
                  aria-describedby={describedBy}
                  className={CARD_FIELD_CONTROL_CLASS}
                />
              )}
            </CardField>
          )}
        />
      </FieldCard>

      <Button type="submit" variant="action" size="role-lg" isDisabled={hasErrors || isPending}>
        {isPending ? <Spinner className="size-5" /> : null}
        {t("submit")}
      </Button>
      {/* A link back to /login, not history-based back: this screen can be
          opened directly, and "back" then has nowhere sensible to go. */}
      <LinkButton href={routes.login} variant="heroGhost" size="role">
        {t("backToSignIn")}
      </LinkButton>
    </form>
  );
};
