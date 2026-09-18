"use client";

import { useState } from "react";

import { PillForm } from "@/shared/ui/pill-form";

// PillForm сам не хранит состояние отправки/значения — эта обвязка живёт
// здесь, в витрине, потому что сценарий записи в вайтлист (Supabase и т.п.)
// в будущем переедет в features, а не в shared/ui (см. ADR 0013).
export const PillFormDemo = () => {
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <PillForm
      placeholder="Ваш email"
      cta="Записаться"
      hint="Оставьте свой email для записи в вайтлист"
      value={value}
      onValueChange={setValue}
      submitted={submitted}
      successText="Спасибо! Мы напишем вам, когда всё будет готово."
      onSubmit={() => setSubmitted(true)}
    />
  );
};
