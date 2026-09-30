"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";

import { Button } from "@/shared/ui/button";
import { FieldError, type FieldErrorItem } from "@/shared/ui/field";
import { HoneypotField } from "@/shared/ui/honeypot-field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

// Pill radius is the one deliberate exception to the 17–26 unification
// (ADR 0012); PillForm is a standalone "pill" form, not a card.
//
// A "dumb" component: it knows nothing about validation rules, what
// happens on submit (onSubmit is the caller's handler), or the success
// text. errors/onBlur follow the same boundary as FieldRow (ADR 0013):
// the component can show a ready-made error under the field and
// highlight the border through Input's standard aria-invalid: variant
// (shared/ui/input.tsx), but the schema and react-hook-form itself stay
// with the caller (currently widgets/waitlist-form + features/
// join-waitlist). The value can stay uncontrolled (defaultValue + an
// internal useState) when no validation is needed — see
// showcase/pill-form-demo.
type PillFormProps = {
  placeholder: string;
  cta: string;
  label?: string;
  hint?: string;
  name?: string;
  submitted?: boolean;
  successText?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  onSubmit?: (value: string, honeypotValue?: string) => void;
  errors?: FieldErrorItem[];
  isSubmitDisabled?: boolean;
  // Optional bot decoy (shared/ui/honeypot-field.tsx) rendered inside this
  // same <form>. PillForm only renders it and, on submit, reads its
  // current value straight off the native <form> via FormData (no ref
  // plumbing needed) — deciding what a filled-in value means is the
  // caller's job (a business scenario, not markup, see ADR 0013's
  // shared/ui boundary), passed through as onSubmit's second argument.
  honeypot?: { name: string; label: string };
};

export const PillForm = ({
  placeholder,
  cta,
  label = placeholder,
  hint,
  name,
  submitted = false,
  successText,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onBlur,
  onSubmit,
  errors,
  isSubmitDisabled = false,
  honeypot,
}: PillFormProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = valueProp ?? uncontrolledValue;
  const id = useId();
  const errorId = useId();
  const invalid = Boolean(errors?.length);

  const handleChange = (next: string) => {
    if (valueProp === undefined) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const honeypotValue = honeypot
      ? (new FormData(event.currentTarget).get(honeypot.name)?.toString() ?? "")
      : undefined;
    onSubmit?.(value, honeypotValue);
  };

  if (submitted) {
    return (
      <div
        role="status"
        className="w-full max-w-100 rounded-2xl bg-card px-5 py-4 text-list-row font-500 text-hero shadow-card"
      >
        {successText}
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-100 flex-col items-center gap-3.5">
      <form onSubmit={handleSubmit} noValidate className="flex w-full flex-col gap-2.5">
        <Label htmlFor={id} className="sr-only">
          {label}
        </Label>
        <Input
          id={id}
          name={name}
          type="email"
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className="h-auto w-full rounded-full border-hero/15 bg-card px-4.5 py-3.5 text-body text-hero placeholder:text-hero/75 focus-visible:border-hero"
        />
        <FieldError id={errorId} errors={errors} className="text-left text-caption" />
        {honeypot ? <HoneypotField name={honeypot.name} label={honeypot.label} /> : null}
        <Button
          type="submit"
          variant="deep"
          size="role"
          isDisabled={isSubmitDisabled}
          className="h-auto w-full rounded-full py-3.5"
        >
          {cta}
        </Button>
      </form>
      {hint ? <p className="text-caption text-ink-muted">{hint}</p> : null}
    </div>
  );
};
