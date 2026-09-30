"use client";

import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";

import { useJoinWaitlist } from "@/features/join-waitlist";
import { PillForm } from "@/shared/ui/pill-form";

// Widget: the waitlist form's layout on top of the "dumb" PillForm. The
// schema, react-hook-form, the server action and the "success"/"submitting"
// states live in features/join-waitlist (ADR 0013: a data-driven scenario
// doesn't belong in shared/ui; ADR 0021: submission itself is a server
// action).
export const WaitlistForm = () => {
  const t = useTranslations("screens.comingSoon");
  const tA11y = useTranslations("a11y");
  const { control, onSubmit, hasErrors, isPending, submitted, formError } = useJoinWaitlist();

  return (
    <Controller
      name="email"
      control={control}
      render={({ field: { name, value, onChange, onBlur }, fieldState }) => {
        const errors = fieldState.error
          ? [fieldState.error]
          : formError
            ? [{ message: formError }]
            : undefined;

        return (
          <PillForm
            name={name}
            label={t("emailPlaceholder")}
            placeholder={t("emailPlaceholder")}
            cta={isPending ? t("submitButtonPending") : t("submitButton")}
            hint={t("hint")}
            value={value}
            onValueChange={onChange}
            onBlur={onBlur}
            errors={errors}
            isSubmitDisabled={hasErrors || isPending}
            submitted={submitted}
            successText={t("successText")}
            onSubmit={(_value, honeypotValue) => onSubmit(honeypotValue)}
            honeypot={{ name: "company", label: tA11y("honeypotLabel") }}
          />
        );
      }}
    />
  );
};
