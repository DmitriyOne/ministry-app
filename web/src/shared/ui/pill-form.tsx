"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";

import { Button } from "@/shared/ui/button";
import { FieldError, type FieldErrorItem } from "@/shared/ui/field";
import { HoneypotField } from "@/shared/ui/honeypot-field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { Spinner } from "@/shared/ui/spinner";

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
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onBlur?: () => void;
  onSubmit?: (value: string, honeypotValue?: string) => void;
  errors?: FieldErrorItem[];
  isSubmitDisabled?: boolean;
  // Submission in flight: the field stops accepting input and the button
  // shows a spinner. `readOnly` rather than `disabled` on the input — a
  // disabled input leaves the tab order and stops having its value read
  // out, so someone using a screen reader loses what they just typed at
  // the exact moment they are waiting to hear what happened. `readOnly`
  // blocks typing and keeps both.
  isPending?: boolean;
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
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onBlur,
  onSubmit,
  errors,
  isSubmitDisabled = false,
  isPending = false,
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
    // A second submit while the first is still running would start a
    // duplicate request — the button is disabled, but Enter in the field
    // still fires the form.
    if (isPending) return;
    const honeypotValue = honeypot
      ? (new FormData(event.currentTarget).get(honeypot.name)?.toString() ?? "")
      : undefined;
    onSubmit?.(value, honeypotValue);
  };

  return (
    <div className="flex w-full max-w-100 flex-col items-center gap-3.5">
      <form
        onSubmit={handleSubmit}
        noValidate
        aria-busy={isPending || undefined}
        className="flex w-full flex-col gap-2.5"
      >
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
          readOnly={isPending}
          placeholder={placeholder}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className="h-auto w-full rounded-full border-hero/15 bg-card px-4.5 py-3.5 text-control text-hero placeholder:text-hero/75 focus-visible:border-hero"
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
          {isPending ? <Spinner className="size-5" /> : null}
          {cta}
        </Button>
      </form>
      {hint ? <p className="text-caption text-ink-muted">{hint}</p> : null}
    </div>
  );
};
