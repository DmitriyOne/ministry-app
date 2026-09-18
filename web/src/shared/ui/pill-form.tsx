"use client";

import type { FormEvent } from "react";
import { useId, useState } from "react";

import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";

// Капсульный радиус — единственное сознательное исключение из унификации
// 17–26 (ADR 0012); PillForm — самостоятельная форма-«таблетка», не карточка.
//
// «Глупый» компонент: не знает, что происходит при отправке (onSubmit —
// чужой обработчик), не хранит текст успеха. Значение можно оставить
// неуправляемым (defaultValue + внутренний useState) — это состояние поля
// ввода, не бизнес-сценарий; сам сценарий (запись в вайтлист) — задача
// будущего слайса features (ADR 0013).
type PillFormProps = {
  placeholder: string;
  cta: string;
  label?: string;
  hint?: string;
  submitted?: boolean;
  successText?: string;
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
};

export const PillForm = ({
  placeholder,
  cta,
  label = placeholder,
  hint,
  submitted = false,
  successText,
  value: valueProp,
  defaultValue = "",
  onValueChange,
  onSubmit,
}: PillFormProps) => {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue);
  const value = valueProp ?? uncontrolledValue;
  const id = useId();

  const handleChange = (next: string) => {
    if (valueProp === undefined) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!value.trim()) return;
    onSubmit?.(value);
  };

  if (submitted) {
    return (
      <p role="status" className="text-list-row font-500 text-primary">
        {successText}
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-100 flex-col items-center gap-3.5">
      <form onSubmit={handleSubmit} className="flex w-full gap-2.5">
        <Label htmlFor={id} className="sr-only">
          {label}
        </Label>
        <Input
          id={id}
          type="email"
          required
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={placeholder}
          className="h-auto min-w-0 flex-1 rounded-full border-hero/15 bg-card px-4.5 py-3.5 text-body text-hero placeholder:text-hero/45 focus-visible:border-hero"
        />
        <Button
          type="submit"
          variant="deep"
          size="role"
          className="h-auto shrink-0 rounded-full py-3.5 whitespace-nowrap"
        >
          {cta}
        </Button>
      </form>
      {hint ? <p className="text-caption text-ink-a50">{hint}</p> : null}
    </div>
  );
};
