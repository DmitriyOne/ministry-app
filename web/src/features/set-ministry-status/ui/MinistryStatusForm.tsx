"use client";

import { useTranslations } from "next-intl";
import { Controller } from "react-hook-form";

import { MINISTRY_STATUS_CHOICES } from "@/entities/ministry-status";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Field, FieldLabel } from "@/shared/ui/field";
import { AlertCircleIcon } from "@/shared/ui/icons";
import { Notice } from "@/shared/ui/notice";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { SheetTitle } from "@/shared/ui/sheet";

import type { UseSetMinistryStatusResult } from "../model/use-set-ministry-status";

type MinistryStatusFormProps = {
  form: UseSetMinistryStatusResult["form"];
  appliesFromLabel: string;
  // Saving asks for confirmation first, so this opens the dialog rather
  // than submitting.
  onSave: () => void;
};

// A colon is legal in an HTML id but awkward everywhere else, and these
// ids are built from the catalogue ("auxiliary_pioneer:15").
const fieldId = (choiceId: string) => `ministry-status-${choiceId.replace(":", "-")}`;

// What is inside the panel: the question, the five answers and the way
// out of it. Part of the feature, not of the widget that opens the
// panel — the same split the install panel uses, where the widget owns
// the sheet and features/install-carousel owns what is in it.
//
// SheetTitle rather than an <h2>: react-aria names the dialog by the
// Heading with slot="title", and without one it warns that the panel has
// no accessible name — which it did, and the owner caught it in the
// console.
export const MinistryStatusForm = ({
  form,
  appliesFromLabel,
  onSave,
}: MinistryStatusFormProps) => {
  const t = useTranslations("screens.profile.ministrySheet");
  // The status names live where the pill in the hero reads them from, so
  // the panel and the pill cannot start saying different words.
  const statusName = useTranslations("screens.profile.ministryStatus");

  return (
    <>
      <div className="flex flex-col gap-1">
        <SheetTitle className="text-day-title font-620 tracking-day-title text-ink">
          {t("title")}
        </SheetTitle>
        <p className="text-caption font-500 text-pretty text-ink-muted">
          {t("intro", { date: appliesFromLabel })}
        </p>
      </div>

      {/* The five rows come from the catalogue, so a number added there
          appears here with nothing else to change. Flat, not nested:
          "auxiliary pioneer on 15" and "on 30" are two answers to one
          question, and the owner chose to show them as two rows. */}
      <Controller
        name="choiceId"
        control={form.control}
        render={({ field }) => (
          <RadioGroup
            value={field.value}
            onChange={field.onChange}
            aria-label={t("title")}
            className="gap-0"
          >
            {MINISTRY_STATUS_CHOICES.map((choice, index) => (
              <Field
                key={choice.id}
                orientation="horizontal"
                className={cn("items-center py-3.5", index > 0 && "border-t border-ink-a09")}
              >
                <RadioGroupItem value={choice.id} id={fieldId(choice.id)} />
                {/* items-start, because Label brings items-center with it
                    and a column under it would centre every line. */}
                <FieldLabel
                  htmlFor={fieldId(choice.id)}
                  className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
                >
                  <span className="text-list-row font-560 tracking-list-row text-ink">
                    {statusName(choice.status)}
                  </span>
                  <span className="text-caption font-500 text-ink-muted">
                    {t(`hint.${choice.status}`)}
                  </span>
                </FieldLabel>
                <span className="shrink-0 text-body font-600 tabular-nums text-primary">
                  {choice.hours === null ? t("noGoal") : t("hours", { hours: choice.hours })}
                </span>
              </Field>
            ))}
          </RadioGroup>
        )}
      />

      {/* Only what a person can act on stays on screen; the backend not
          answering is a toast the hook raises (ADR 0046). */}
      {form.formError
        ? (
            <Notice tone="negative" icon={<AlertCircleIcon className="size-5" />}>
              {form.formError}
            </Notice>
          )
        : null}

      <Button
        variant="deep"
        size="role-lg"
        className="w-full"
        isDisabled={form.hasErrors || form.isPending}
        onPress={onSave}
      >
        {t("save")}
      </Button>
    </>
  );
};
