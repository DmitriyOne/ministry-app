"use client";

import { useId, useState } from "react";
import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";
import { Field, FieldError, FieldLabel, type FieldErrorItem } from "@/shared/ui/field";
import { EyeIcon } from "@/shared/ui/icons";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/shared/ui/input-group";

type PasswordFieldProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "type" | "id" | "aria-describedby" | "aria-invalid"
> & {
  // Visible caption above the control; the caller owns the text.
  label: string;
  errors?: FieldErrorItem[];
};

// Password input with a show/hide eye button, meant to sit inside a
// FieldCard. Errors render under the control and are tied to it via
// aria-describedby; the invalid state is derived from `errors`, never
// passed in separately.
export const PasswordField = ({ label, errors, className, ...props }: PasswordFieldProps) => {
  const t = useTranslations("a11y");
  const inputId = useId();
  const errorId = useId();
  const [isShown, setIsShown] = useState(false);

  const hasErrors = Boolean(errors?.some((error) => error?.message));

  return (
    <Field className="gap-1.5 py-3">
      <FieldLabel
        htmlFor={inputId}
        className="text-eyebrow font-600 tracking-eyebrow text-ink-faint uppercase"
      >
        {label}
      </FieldLabel>
      {/* InputGroup is the single source of the focus and error styling:
          it sets data-invalid from isInvalid and reacts through
          data-[invalid=true]: classes, with focus-within listed before them
          so a focused invalid field stays terracotta (ADR 0013). The
          negative margins undo the padding, so the border sits around the
          row without moving it inside the card. */}
      <InputGroup
        isInvalid={hasErrors}
        className="-mx-2 -my-1 h-auto gap-2.5 rounded-xs border-transparent px-2 py-1"
      >
        <InputGroupInput
          {...props}
          id={inputId}
          type={isShown ? "text" : "password"}
          aria-invalid={hasErrors || undefined}
          aria-describedby={hasErrors ? errorId : undefined}
          // No border and no ring of its own: both live on the group.
          // aria-invalid stays as semantics for screen readers only.
          className={cn(
            "h-auto min-w-0 p-0 text-list-row font-560 text-ink aria-invalid:border-0",
            className,
          )}
        />
        <InputGroupAddon align="inline-end" className="p-0 has-[>button]:mr-0">
          <InputGroupButton
            size="icon-sm"
            onPress={() => setIsShown((shown) => !shown)}
            aria-label={isShown ? t("hidePassword") : t("showPassword")}
            className="-mr-1.5 rounded-mark-md text-ink-faint hover:bg-transparent"
          >
            <EyeIcon crossed={!isShown} />
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <FieldError id={errorId} errors={errors} />
    </Field>
  );
};
