"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Controller, type Control } from "react-hook-form";

import { Field, FieldError, FieldLabel } from "@/shared/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/shared/ui/input-group";

import type { MinistryChoiceValues } from "../model/schema";

type GoalHoursFieldProps = {
  control: Control<MinistryChoiceValues>;
};

// The one number a person types in this app: a publisher's own monthly
// goal. Every other status takes its hours from the catalogue, so this
// field belongs to that one row and appears with it.
//
// Its own component because the panel reads as a list of five answers,
// and a twenty-line field inlined between them buries that; and because
// the ids below have to tie three elements together, which is easier to
// get right in one place than amid the rows. It is rendered under the
// publisher's row — see the note at the call site about what that costs
// and why it is still right.
//
// Both the hint and the error are named by aria-describedby. The hint
// alone was there first, and it meant a screen reader announced "leave
// it empty for no goal" over a field that had just been refused.
export const GoalHoursField = ({ control }: GoalHoursFieldProps) => {
  const t = useTranslations("screens.profile.ministrySheet.goal");
  const fieldId = useId();
  const hintId = useId();
  const errorId = useId();

  return (
    <Controller
      name="goalHours"
      control={control}
      render={({ field, fieldState }) => (
        <Field className="gap-1.5">
          <FieldLabel htmlFor={fieldId} className="text-caption font-560 text-ink-muted">
            {t("label")}
          </FieldLabel>

          {/* A filled plate rather than the registry's outlined box, and
              the suffix sits next to the number rather than at the far
              edge — the design draws it as one quiet field inside the
              panel, not as a form control fighting the white card. The
              input is given a fixed width so the free space falls after
              the suffix instead of between the two. */}
          <InputGroup className="h-13 rounded-button border-transparent bg-ink-a07">
            <InputGroupInput
              {...field}
              id={fieldId}
              inputMode="numeric"
              autoComplete="off"
              aria-describedby={fieldState.error ? `${hintId} ${errorId}` : hintId}
              className="w-16 flex-none text-list-row font-600 tabular-nums"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupText className="text-body font-500 text-ink-muted">
                {t("suffix")}
              </InputGroupText>
            </InputGroupAddon>
          </InputGroup>

          {/* Empty is an answer, not an unfinished form, and the field
              says so rather than leaving it to be guessed. */}
          <p id={hintId} className="text-caption font-500 text-ink-muted">
            {t("hint")}
          </p>

          <FieldError
            id={errorId}
            errors={fieldState.error ? [fieldState.error] : undefined}
          />
        </Field>
      )}
    />
  );
};
