"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { PasswordField } from "@/entities/password-field";
import { useSignIn } from "@/features/sign-in";
import { routes } from "@/shared/config";
import { AppMark } from "@/shared/ui/app-mark";
import { BodyText } from "@/shared/ui/body-text";
import { Button, LinkButton } from "@/shared/ui/button";
import { CenteredState } from "@/shared/ui/centered-state";
import { CARD_FIELD_CONTROL_CLASS, CardField } from "@/shared/ui/card-field";
import { FieldCard } from "@/shared/ui/field-card";
import { InputGroupInput } from "@/shared/ui/input-group";
import { InlineError } from "@/shared/ui/inline-error";
import { Spinner } from "@/shared/ui/spinner";
import { Title } from "@/shared/ui/title";

export const LoginScreen = () => {
  const t = useTranslations("screens.login");
  const { control, onSubmit, hasErrors, isPending, formError } = useSignIn();

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

        <Button
          type="submit"
          variant="action"
          size="role-lg"
          isDisabled={hasErrors || isPending}
        >
          {isPending ? <Spinner className="size-5" /> : null}
          {t("submit")}
        </Button>
        <LinkButton href={routes.forgotPassword} variant="heroGhost" size="role">
          {t("forgotPassword")}
        </LinkButton>
        <BodyText tone="hero" className="px-3 pt-1.5 text-center text-caption text-hero-foreground/40">
          {t("footnote")}
        </BodyText>
      </form>
    </CenteredState>
  );
};
