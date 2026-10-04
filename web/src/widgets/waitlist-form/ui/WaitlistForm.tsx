"use client";

import { Controller } from "react-hook-form";
import { useTranslations } from "next-intl";

import { useJoinWaitlist } from "@/features/join-waitlist";
import { PillForm } from "@/shared/ui/pill-form";

import { WaitlistSuccess } from "./WaitlistSuccess";

export const WaitlistForm = () => {
  const t = useTranslations("screens.comingSoon");
  const tA11y = useTranslations("a11y");

  const {
    control,
    onSubmit,
    hasErrors,
    isPending,
    submitted,
    formError,
    position,
    alreadyJoined,
    pushEnrollmentToken,
  } = useJoinWaitlist();

  if (submitted) {
    return (
      <WaitlistSuccess
        position={position}
        alreadyJoined={alreadyJoined}
        pushEnrollmentToken={pushEnrollmentToken}
      />
    );
  }

  return (
    <Controller
      name="email"
      control={control}
      render={({
        field: {
          name,
          value,
          onChange,
          onBlur,
        },
        fieldState,
      }) => {
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
            cta={
              isPending
                ? t("submitButtonPending")
                : t("submitButton")
            }
            hint={t("hint")}
            value={value}
            onValueChange={onChange}
            onBlur={onBlur}
            errors={errors}
            isSubmitDisabled={
              hasErrors || isPending
            }
            isPending={isPending}
            onSubmit={(_value, honeypotValue) =>
              onSubmit(honeypotValue)}
            honeypot={{
              name: "company",
              label: tA11y("honeypotLabel"),
            }}
          />
        );
      }}
    />
  );
};
