import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { Children, Fragment, isValidElement, useId } from "react";

import { Card } from "@/shared/ui/card";
import { Field, FieldError, FieldLabel, type FieldErrorItem } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { PasswordField } from "@/shared/ui/password-field";
import { Separator } from "@/shared/ui/separator";

type FieldRowProps = Omit<ComponentPropsWithoutRef<"input">, "type" | "id" | "className"> & {
  label: string;
  secure?: boolean;
  trailing?: ReactNode;
  errors?: FieldErrorItem[];
  showLabel?: string;
  hideLabel?: string;
};

// secure=true отдаёт рендер клиентскому PasswordField (нужен useState для
// показа/скрытия); во всех остальных случаях строка остаётся серверной.
export const FieldRow = ({
  label,
  secure,
  trailing,
  errors,
  showLabel,
  hideLabel,
  ...inputProps
}: FieldRowProps) => {
  const id = useId();
  const errorId = useId();
  const invalid = Boolean(errors?.length);

  if (secure) {
    return (
      <PasswordField
        label={label}
        errors={errors}
        showLabel={showLabel}
        hideLabel={hideLabel}
        {...inputProps}
      />
    );
  }

  return (
    <Field data-invalid={invalid} className="gap-1.25">
      <FieldLabel
        htmlFor={id}
        className="text-field-label font-600 tracking-eyebrow uppercase text-ink-a40"
      >
        {label}
      </FieldLabel>
      <div
        data-invalid={invalid}
        className="flex items-center gap-2.5 rounded-sm border border-transparent -mx-2 -my-1 px-2 py-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[invalid=true]:border-negative data-[invalid=true]:ring-3 data-[invalid=true]:ring-negative/20"
      >
        <Input
          id={id}
          type="text"
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 text-list-row font-560 tracking-list-row shadow-none ring-0 focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0"
          {...inputProps}
        />
        {trailing}
      </div>
      <FieldError id={errorId} errors={errors} />
    </Field>
  );
};

type FieldCardProps = {
  children: ReactNode;
};

export const FieldCard = ({ children }: FieldCardProps) => {
  const rows = Children.toArray(children).filter(isValidElement);

  return (
    <Card className="gap-0 rounded-field-card px-4.5 py-0 shadow-card ring-0">
      {rows.map((row, index) => (
        <Fragment key={row.key ?? index}>
          <div className="py-3">{row}</div>
          {index < rows.length - 1 ? <Separator /> : null}
        </Fragment>
      ))}
    </Card>
  );
};
