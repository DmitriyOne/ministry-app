"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { PasswordField } from "@/entities/password-field";
import { useCreateUser } from "@/features/create-user";
import { APP_ROLES } from "@/shared/lib/auth";
import { CardTextField } from "@/shared/ui/card-text-field";
import { ActionForm } from "@/shared/ui/action-form";
import { FieldCard } from "@/shared/ui/field-card";
import { SubmitButton } from "@/shared/ui/submit-button";
import { Notice } from "@/shared/ui/notice";
import { Field, FieldLabel } from "@/shared/ui/field";
import { AlertCircleIcon } from "@/shared/ui/icons";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import { cn } from "@/shared/lib/cn";

// The admin's "issue credentials" form. Same split as the other two
// forms: this widget wires features/create-user to shared controls, the
// screen only places it.
export const CreateUserForm = () => {
  const t = useTranslations("screens.adminNewUser");
  const { control, onSubmit, hasErrors, isPending, formError } = useCreateUser();

  return (
    <ActionForm onSubmit={onSubmit}>
      <FieldCard>
        <Controller
          name="displayName"
          control={control}
          render={({ field, fieldState }) => (
            <CardTextField
              {...field}
              label={t("nameLabel")}
              placeholder={t("namePlaceholder")}
              type="text"
              autoComplete="off"
              errors={fieldState.error && [fieldState.error]}
            />
          )}
        />
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
              // Not "email": this is someone else's address, and the browser
              // offering the admin's own is a way to create an account for
              // the wrong person.
              autoComplete="off"
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
              // new-password, so the browser offers to generate one and
              // never autofills the admin's own.
              autoComplete="new-password"
              errors={fieldState.error && [fieldState.error]}
            />
          )}
        />
        <Controller
          name="passwordConfirm"
          control={control}
          render={({ field, fieldState }) => (
            <PasswordField
              {...field}
              label={t("passwordConfirmLabel")}
              placeholder={t("passwordConfirmPlaceholder")}
              autoComplete="new-password"
              errors={fieldState.error && [fieldState.error]}
            />
          )}
        />
      </FieldCard>

      {/* The registry's own pattern for this control: the radio and its
          caption are siblings inside a horizontal Field, tied by
          htmlFor/id. Putting the caption inside RadioGroupItem would put
          it inside a 16px circle. */}
      <Controller
        name="role"
        control={control}
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onChange={field.onChange}
            aria-label={t("roleLabel")}
            className="gap-0 rounded-xl bg-background px-4 shadow-card"
          >
            {APP_ROLES.map((role, index) => (
              <Field
                key={role}
                orientation="horizontal"
                className={cn("items-center py-3.5", index > 0 && "border-t border-ink-a09")}
              >
                <RadioGroupItem value={role} id={`${field.name}-${role}`} />
                <FieldLabel
                  htmlFor={`${field.name}-${role}`}
                  className="text-list-row font-560 text-ink"
                >
                  {t(role === "admin" ? "roleAdmin" : "roleUser")}
                </FieldLabel>
              </Field>
            ))}
          </RadioGroup>
        )}
      />

      {/* Only what the admin has to act on stays on the screen: a taken
          address, too many attempts, a role that did not apply. Success
          is a toast (the hook raises it) — it has nothing to be acted on
          and should not sit above the fields while the next account is
          typed. A light plate with dark red text rather than InlineError,
          which is built for the deep green background. */}
      {formError
        ? (
            <Notice tone="negative" icon={<AlertCircleIcon className="size-5" />}>
              {formError}
            </Notice>
          )
        : null}

      <SubmitButton isPending={isPending} isBlocked={hasErrors}>
        {t("submit")}
      </SubmitButton>
    </ActionForm>
  );
};
