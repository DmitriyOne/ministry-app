"use client";

import { useState } from "react";
import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";
import { CARD_FIELD_CONTROL_CLASS, CardField } from "@/shared/ui/card-field";
import type { FieldErrorItem } from "@/shared/ui/field";
import { EyeIcon } from "@/shared/ui/icons";
import { InputGroupAddon, InputGroupButton, InputGroupInput } from "@/shared/ui/input-group";

type PasswordFieldProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "type" | "id" | "aria-describedby" | "aria-invalid"
> & {
  // Visible caption above the control; the caller owns the text (domain copy).
  label: string;
  errors?: FieldErrorItem[];
};

// A password row for a FieldCard, with a show/hide eye button inside the
// control. The row itself — caption, wiring, error state — is CardField's
// job; what is left here is the one thing that makes this field a password
// field: the state behind that button.
export const PasswordField = ({ label, errors, className, ...props }: PasswordFieldProps) => {
  const t = useTranslations("a11y");
  const [isShown, setIsShown] = useState(false);

  return (
    <CardField label={label} errors={errors}>
      {({ id, describedBy, isInvalid }) => (
        <>
          <InputGroupInput
            {...props}
            id={id}
            type={isShown ? "text" : "password"}
            aria-invalid={isInvalid || undefined}
            aria-describedby={describedBy}
            className={cn(CARD_FIELD_CONTROL_CLASS, className)}
          />
          <InputGroupAddon align="inline-end" className="p-0 has-[>button]:mr-0 has-[>button]:pr-0">
            <InputGroupButton
              size="icon-sm"
              onPress={() => setIsShown((shown) => !shown)}
              // No aria-pressed beside this: the label already says which
              // state pressing it leads to, and both would announce it twice.
              aria-label={isShown ? t("hidePassword") : t("showPassword")}
              className="rounded-mark-md text-ink-faint hover:bg-transparent"
            >
              <EyeIcon crossed={!isShown} />
            </InputGroupButton>
          </InputGroupAddon>
        </>
      )}
    </CardField>
  );
};
