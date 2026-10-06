"use client";

import { useId, useState } from "react";
import type { ComponentProps } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/shared/lib/cn";
import { Field, FieldError, FieldLabel, type FieldErrorItem } from "@/shared/ui/field";
import { EyeIcon } from "@/shared/ui/icons";
import { Input } from "@/shared/ui/input";

type PasswordFieldProps = Omit<
  ComponentProps<typeof Input>,
  "type" | "id" | "aria-describedby" | "aria-invalid"
> & {
  // Visible caption above the control; the caller owns the text (it is
  // domain copy, which shared/ui must not hardcode).
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
      {/* One source for the error styling: data-invalid on the wrapper
          around the input and the eye button, every visual reaction
          expressed as data-[invalid=true]: classes on it. ADR 0013 settled
          this shape and wrote it for this component specifically — it
          names the wrapper div around the input and the eye button as the
          one place that carries it. focus-within comes before
          data-[invalid=true] so a focused invalid field stays terracotta
          instead of flipping to the focus ring. The negative margins undo
          the padding, so the border can sit around the row without moving
          it inside the card. */}
      <div
        data-invalid={hasErrors}
        className="-mx-2 -my-1 flex items-center gap-2.5 rounded-xs border border-transparent px-2 py-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[invalid=true]:border-negative data-[invalid=true]:ring-3 data-[invalid=true]:ring-negative/20"
      >
        <Input
          {...props}
          id={inputId}
          type={isShown ? "text" : "password"}
          aria-invalid={hasErrors || undefined}
          aria-describedby={hasErrors ? errorId : undefined}
          // No border and no ring of its own: ADR 0013 keeps both on the
          // wrapper above, so focus and error never draw two outlines
          // around one control. aria-invalid stays, as semantics for
          // screen readers rather than as styling.
          className={cn(
            "h-auto min-w-0 flex-1 rounded-none border-0 bg-transparent p-0 text-list-row font-560 text-ink shadow-none outline-none focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0",
            className,
          )}
        />
        <button
          type="button"
          onClick={() => setIsShown((shown) => !shown)}
          aria-label={isShown ? t("hidePassword") : t("showPassword")}
          className="-mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-mark-md text-ink-faint outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <EyeIcon crossed={!isShown} />
        </button>
      </div>
      <FieldError id={errorId} errors={errors} />
    </Field>
  );
};
