"use client";

import type { ComponentProps } from "react";

import { cn } from "@/shared/lib/cn";
import { CARD_FIELD_CONTROL_CLASS, CardField } from "@/shared/ui/card-field";
import type { FieldErrorItem } from "@/shared/ui/field";
import { InputGroupInput } from "@/shared/ui/input-group";

// A plain text row for a FieldCard — the same relationship to CardField
// that PasswordField has, minus the eye button. Deliberately the same prop
// shape as PasswordField, so the two fields of a form read alike instead
// of one being six lines and the other eighteen.
//
// Every form was writing this out: the render prop, the three aria
// attributes, CARD_FIELD_CONTROL_CLASS. None of it is a decision a form
// makes — getting one of them wrong (dropping aria-describedby, say)
// breaks the field's error quietly, for screen readers only.
//
// Dumb on purpose: no react-hook-form here, so this stays inside the
// shared/ui boundary (ADR 0013). The caller spreads Controller's `field`
// onto it, exactly as it already does with PasswordField.
type CardTextFieldProps = Omit<
  ComponentProps<typeof InputGroupInput>,
  "id" | "aria-describedby" | "aria-invalid"
> & {
  // Visible caption above the control; the caller owns the text (domain copy).
  label: string;
  errors?: FieldErrorItem[];
};

export const CardTextField = ({ label, errors, className, ...props }: CardTextFieldProps) => (
  <CardField label={label} errors={errors}>
    {({ id, describedBy, isInvalid }) => (
      <InputGroupInput
        {...props}
        id={id}
        aria-invalid={isInvalid || undefined}
        aria-describedby={describedBy}
        className={cn(CARD_FIELD_CONTROL_CLASS, className)}
      />
    )}
  </CardField>
);
