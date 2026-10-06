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
// the error state — ADR 0013 puts data-invalid on the group around the
// control (InputGroup sets it from isInvalid) with focus-within listed
// before it, so a focused invalid field stays terracotta. Copying that into
// each field is exactly how the "one source" rule in ADR 0013 gets lost: the
// next change to it would have to be made twice, and one copy would drift.
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
        className="-mx-2 -my-1 h-auto gap-2.5 rounded-xs border-transparent px-2 py-1"
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
  = "h-auto min-w-0 p-0 text-list-row font-560 text-ink aria-invalid:border-0";
