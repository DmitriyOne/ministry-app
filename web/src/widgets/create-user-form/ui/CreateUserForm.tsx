"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { PasswordField } from "@/entities/password-field";
import { useCreateUser } from "@/features/create-user";
import { APP_ROLES } from "@/shared/lib/auth";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import { CARD_FIELD_CONTROL_CLASS, CardField } from "@/shared/ui/card-field";
import { FieldCard } from "@/shared/ui/field-card";
import { Field, FieldLabel } from "@/shared/ui/field";
import { AlertCircleIcon } from "@/shared/ui/icons";
import { InputGroupInput } from "@/shared/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { Spinner } from "@/shared/ui/spinner";

import { cn } from "@/shared/lib/cn";

// The admin's "issue credentials" form. Same split as the other two
// forms: this widget wires features/create-user to shared controls, the
// screen only places it.
export const CreateUserForm = () => {
  const t = useTranslations("screens.adminNewUser");
  const { control, onSubmit, hasErrors, isPending, formError } = useCreateUser();

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
          name="displayName"
          control={control}
          render={({ field, fieldState }) => (
            <CardField label={t("nameLabel")} errors={fieldState.error && [fieldState.error]}>
              {({ id, describedBy, isInvalid }) => (
                <InputGroupInput
                  {...field}
                  id={id}
                  type="text"
                  autoComplete="off"
                  placeholder={t("namePlaceholder")}
                  aria-invalid={isInvalid || undefined}
                  aria-describedby={describedBy}
                  className={CARD_FIELD_CONTROL_CLASS}
                />
              )}
            </CardField>
          )}
        />
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
                  // Not "email": this is someone else's address, and the
                  // browser offering the admin's own is a way to create an
                  // account for the wrong person.
                  autoComplete="off"
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
            <Alert variant="destructive" className="rounded-xl border-0 px-4 py-3.5 shadow-card">
              <AlertCircleIcon className="size-5" />
              <AlertDescription className="text-caption font-540 text-negative">
                {formError}
              </AlertDescription>
            </Alert>
          )
        : null}

      <Button type="submit" variant="action" size="role-lg" isDisabled={hasErrors || isPending}>
        {isPending ? <Spinner className="size-5" /> : null}
        {t("submit")}
      </Button>
    </form>
  );
};
