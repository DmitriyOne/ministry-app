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
  const { control, onSubmit, hasErrors, isPending, submitted, formError, position, alreadyJoined } =
    useJoinWaitlist();

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

        // Three cases, in the order they are decided: a number and the
        // address was already there, a number and it is new, or no number
        // at all (the honeypot branch returns a success without one —
        // ADR 0026 — and a bot must see an ordinary success card).
        const successText =
          position === undefined
            ? t("successText")
            : alreadyJoined
              ? t("alreadyJoinedText", { position })
              : t("successTextNumbered", { position });

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
            isPending={isPending}
            submitted={submitted}
            successText={successText}
            onSubmit={(_value, honeypotValue) => onSubmit(honeypotValue)}
            honeypot={{ name: "company", label: tA11y("honeypotLabel") }}
          />
        );
      }}
    />
  );
};
