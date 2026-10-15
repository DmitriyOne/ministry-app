"use client";

import { useId } from "react";
import type { ReactNode } from "react";

import { Field, FieldError, FieldLabel, type FieldErrorItem } from "./field";
import { InputGroup } from "./input-group";

type CardFieldControl = {
  id: string;
  describedBy: string | undefined;
  isInvalid: boolean;
};

type CardFieldProps = {
  // Visible caption above the control; the caller owns the text, since
  // shared/ui must not hardcode domain copy.
  label: string;
  errors?: FieldErrorItem[];
  // The control itself, handed the ids and the invalid flag it has to carry.
  // A render prop rather than a plain node because the wiring between the
  // label, the control and the error message cannot be guessed from outside.
  children: (control: CardFieldControl) => ReactNode;
};

// One row of a FieldCard: eyebrow caption, the control, the error under it.
//
// It exists because the row is where several decisions live at once, and
// every one of them would otherwise be copied per field: the eyebrow styling,
// the label-to-control and control-to-error wiring via useId, and above all
// the error state. Copying those into each field is exactly how the "one
// source" rule in ADR 0013 gets lost: the next change would have to be made
// twice, and one copy would drift — which is what happened here once already,
// when the email row arrived as a near-copy of the password one.
export const CardField = ({ label, errors, children }: CardFieldProps) => {
  const inputId = useId();
  const errorId = useId();
  const isInvalid = Boolean(errors?.some((error) => error?.message));

  return (
    <Field className="gap-1.5 py-3">
      <FieldLabel
        htmlFor={inputId}
        className="text-eyebrow font-600 tracking-eyebrow text-ink-faint uppercase"
      >
        {label}
      </FieldLabel>
      <InputGroup
        isInvalid={isInvalid}
        className="h-auto gap-2.5 rounded-none border-0 bg-transparent p-0 shadow-none"
      >
        {children({ id: inputId, describedBy: isInvalid ? errorId : undefined, isInvalid })}
      </InputGroup>
      <FieldError id={errorId} errors={errors} />
    </Field>
  );
};

// The class every control inside a CardField wears: no border or ring of its
// own, because ADR 0013 keeps both on the group above.
export const CARD_FIELD_CONTROL_CLASS
  // aria-invalid:border-0 is the one cancellation still needed: the base
  // Input keeps its error border for PillForm's sake, and inside a card it
  // must not draw one. The ring cancellations are gone with the rings
  // themselves.
  = "h-auto min-w-0 border-0 bg-transparent p-0 text-list-row font-560 text-ink shadow-none outline-none aria-invalid:border-0 aria-invalid:text-negative";
