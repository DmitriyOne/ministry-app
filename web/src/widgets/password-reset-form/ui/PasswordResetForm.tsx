"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { useRequestPasswordReset } from "@/features/request-password-reset";
import { routes } from "@/shared/config";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button, LinkButton } from "@/shared/ui/button";
import { CardTextField } from "@/shared/ui/card-text-field";
import { FieldCard } from "@/shared/ui/field-card";
import { InlineError } from "@/shared/ui/inline-error";
import { CheckCircleIcon } from "@/shared/ui/icons";
import { Spinner } from "@/shared/ui/spinner";

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
        {/* @shadcn/alert: a light plate whose icon sits in its own grid
            column, which is the whole reason it is here rather than a
            paragraph — no layout of our own, and role="alert" comes with
            it, so the message is announced when it replaces the form. */}
        {/* text-primary sits on the plate, not on the icon: the registry
            forces every direct <svg> child to currentColor with a
            selector that outranks a plain class, so the colour has to
            come down as the plate's own. The description below states
            its colour and is unaffected. */}
        <Alert className="rounded-xl border-0 px-4 py-3.5 text-primary shadow-card">
          <CheckCircleIcon className="size-5" />
          <AlertDescription className="text-caption font-540 text-ink-muted">
            {t("sent")}
          </AlertDescription>
        </Alert>
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

      <Button type="submit" variant="action" size="role-lg" isDisabled={hasErrors || isPending}>
        {isPending ? <Spinner className="size-5" /> : null}
        {t("submit")}
      </Button>
    </form>
  );
};
