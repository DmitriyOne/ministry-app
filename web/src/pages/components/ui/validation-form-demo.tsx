"use client";

import { useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";

import { ActionStack } from "@/shared/ui/action-stack";
import { Button } from "@/shared/ui/button";
import { FieldCard, FieldRow } from "@/shared/ui/field-card";

export const ValidationFormDemo = () => {
  const t = useTranslations("showcase.components.cards.validationDemo");

  // Схема и useForm — здесь, не в shared/ui: shared/ui знает только про
  // errors, не про то, что именно проверяется (см. ADR 0013). На реальных
  // экранах эта обвязка переедет в соответствующий features-слайс. Тексты
  // ошибок — из словаря, поэтому схема строится внутри компонента, не на
  // уровне модуля, и пересобирается только если сам t поменяется.
  const schema = useMemo(
    () =>
      z.object({
        email: z.string().min(1, t("emailRequired")).email(t("emailInvalid")),
        password: z.string().min(6, t("passwordMinLength")),
      }),
    [t],
  );

  type FormValues = z.infer<typeof schema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onSubmit",
    reValidateMode: "onChange",
  });

  // До первого submit formState.errors пуст (react-hook-form не валидирует
  // нетронутую форму сам по себе) — кнопка остаётся активной на пустой
  // форме. После первого submit ошибки появляются и обновляются на каждый
  // ввод (reValidateMode: onChange), кнопка блокируется, пока они есть.
  const hasErrors = Object.keys(errors).length > 0;

  return (
    <form onSubmit={handleSubmit(() => {})} noValidate className="flex w-full flex-col gap-4">
      <FieldCard>
        <Controller
          name="email"
          control={control}
          render={({ field: { name, value, onChange, onBlur }, fieldState }) => (
            <FieldRow
              label={t("emailLabel")}
              placeholder={t("emailPlaceholder")}
              errors={fieldState.error ? [fieldState.error] : undefined}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
        />
        <Controller
          name="password"
          control={control}
          render={({ field: { name, value, onChange, onBlur }, fieldState }) => (
            <FieldRow
              label={t("passwordLabel")}
              secure
              placeholder={t("passwordPlaceholder")}
              errors={fieldState.error ? [fieldState.error] : undefined}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
            />
          )}
        />
      </FieldCard>
      <ActionStack maxWidth="full">
        <Button type="submit" variant="deep" size="role" isDisabled={hasErrors}>
          {t("submit")}
        </Button>
      </ActionStack>
    </form>
  );
};
