"use client";

import type { ComponentPropsWithoutRef } from "react";
import { useId, useState } from "react";

import { EyeIcon, EyeOffIcon } from "@/shared/ui/icons";
import { FieldError, type FieldErrorItem } from "@/shared/ui/field";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

type PasswordFieldProps = Omit<
  ComponentPropsWithoutRef<"input">,
  "type" | "id" | "className"
> & {
  label: string;
  visible?: boolean;
  onVisibleChange?: (visible: boolean) => void;
  showLabel?: string;
  hideLabel?: string;
  errors?: FieldErrorItem[];
};

// Показ/скрытие — состояние самого поля (как у shadcn Dialog/Accordion),
// не бизнес-логика; visible/onVisibleChange необязательны, если поле нужно
// сделать управляемым снаружи.
export const PasswordField = ({
  label,
  visible: visibleProp,
  onVisibleChange,
  showLabel = "Показать пароль",
  hideLabel = "Скрыть пароль",
  errors,
  ...inputProps
}: PasswordFieldProps) => {
  const [uncontrolledVisible, setUncontrolledVisible] = useState(false);
  const visible = visibleProp ?? uncontrolledVisible;
  const id = useId();
  const errorId = useId();
  const invalid = Boolean(errors?.length);

  const toggleVisible = () => {
    const next = !visible;
    if (visibleProp === undefined) setUncontrolledVisible(next);
    onVisibleChange?.(next);
  };

  return (
    <div className="flex flex-col gap-1.25" data-invalid={invalid}>
      <Label
        htmlFor={id}
        className="text-field-label font-600 tracking-eyebrow uppercase text-ink-a40"
      >
        {label}
      </Label>
      <div
        data-invalid={invalid}
        className="flex items-center gap-2.5 rounded-sm border border-transparent -mx-2 -my-1 px-2 py-1 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 data-[invalid=true]:border-negative data-[invalid=true]:ring-3 data-[invalid=true]:ring-negative/20"
      >
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={invalid || undefined}
          aria-describedby={invalid ? errorId : undefined}
          className="h-auto flex-1 rounded-none border-0 bg-transparent p-0 text-list-row font-560 tracking-list-row shadow-none ring-0 focus-visible:border-0 focus-visible:ring-0 aria-invalid:border-0 aria-invalid:ring-0"
          {...inputProps}
        />
        <button
          type="button"
          onClick={toggleVisible}
          aria-label={visible ? hideLabel : showLabel}
          aria-pressed={visible}
          className="-my-1.5 -mr-1.5 flex size-8 shrink-0 items-center justify-center rounded-mark-md text-ink-a45 pressable [--press-scale:0.9]"
        >
          {visible ? <EyeOffIcon size={21} /> : <EyeIcon size={21} />}
        </button>
      </div>
      <FieldError id={errorId} errors={errors} />
    </div>
  );
};
