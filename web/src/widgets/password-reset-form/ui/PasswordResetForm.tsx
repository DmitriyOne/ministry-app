"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { useRequestPasswordReset } from "@/features/request-password-reset";
import { routes } from "@/shared/config";
import { LinkButton } from "@/shared/ui/button";
import { CardTextField } from "@/shared/ui/card-text-field";
import { ActionForm } from "@/shared/ui/action-form";
import { FieldCard } from "@/shared/ui/field-card";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Notice } from "@/shared/ui/notice";
import { InlineError } from "@/shared/ui/inline-error";
import { CheckCircleIcon } from "@/shared/ui/icons";

// The same split as widgets/sign-in-form: this block wires the feature's
// hook to shared controls, the screen only places it.
export const PasswordResetForm = () => {
  const t = useTranslations("screens.forgotPassword");
  const { control, onSubmit, hasErrors, isPending, isSent, formError }
    = useRequestPasswordReset();

  // One state replaces the form, as on the waitlist screen. The text says
  // nothing about whether that address has an account — the action is
  // deliberately unable to tell, and saying "no such account" here is
  // exactly what would make the page a way to find out.
  if (isSent) {
    return (
      <div className="flex flex-col gap-3.5">
        {/* role="alert" comes with the plate, so the message is announced
            when it replaces the form. */}
        <Notice tone="positive" icon={<CheckCircleIcon className="size-5" />}>
          {t("sent")}
        </Notice>
        <LinkButton href={routes.login} variant="action" size="role-lg">
          {t("backToSignIn")}
        </LinkButton>
      </div>
    );
  }

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
      </FieldCard>

      {formError ? <InlineError>{formError}</InlineError> : null}

      <SubmitButton isPending={isPending} isBlocked={hasErrors}>
        {t("submit")}
      </SubmitButton>
    </ActionForm>
  );
};
