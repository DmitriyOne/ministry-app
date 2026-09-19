"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { PillForm } from "@/shared/ui/pill-form";

// PillForm сам не хранит состояние отправки/значения — эта обвязка живёт
// здесь, в витрине, потому что сценарий записи в вайтлист (Supabase и т.п.)
// в будущем переедет в features, а не в shared/ui (см. ADR 0013).
export const PillFormDemo = () => {
  const t = useTranslations("showcase.components.cards.pillForm");
  const [value, setValue] = useState("");
  const [submitted, setSubmitted] = useState(false);

  return (
    <PillForm
      placeholder={t("placeholder")}
      cta={t("cta")}
      hint={t("hint")}
      value={value}
      onValueChange={setValue}
      submitted={submitted}
      successText={t("successText")}
      onSubmit={() => setSubmitted(true)}
    />
  );
};
