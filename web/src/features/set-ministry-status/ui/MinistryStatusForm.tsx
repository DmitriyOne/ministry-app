"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Controller, useWatch } from "react-hook-form";

import { MINISTRY_STATUS_CHOICES } from "@/entities/ministry-status";
import { cn } from "@/shared/lib/cn";
import { ActionForm } from "@/shared/ui/action-form";
import { Field, FieldLabel } from "@/shared/ui/field";
import { AlertCircleIcon } from "@/shared/ui/icons";
import { Notice } from "@/shared/ui/notice";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";
import { SheetTitle } from "@/shared/ui/sheet";
import { SubmitButton } from "@/shared/ui/submit-button";

import type { UseSetMinistryStatusResult } from "../model/use-set-ministry-status";
import { GoalHoursField } from "./GoalHoursField";
import { PioneerStartField } from "./PioneerStartField";

type MinistryStatusFormProps = {
  form: UseSetMinistryStatusResult["form"];
  monthLabel: string;
  // The two months the pioneer's sub-question names, or null when there
  // is nothing to ask — see the hook.
  pioneerStart: UseSetMinistryStatusResult["pioneerStart"];
  // Saving asks for confirmation first, so submitting this form opens
  // the dialog; the status is sent from there.
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
//
// A real <form>, through the project's ActionForm, and not because every
// form has one: pressing Enter in the goal field has to save. Without the
// element there is nothing to submit implicitly, so the key did nothing
// at all and iOS offered a plain return instead of "go" — the owner
// caught that too. SubmitButton for the same reason, and it carries the
// two rules about blocking and the spinner that were spelled out here by
// hand (ADR 0013).
export const MinistryStatusForm = ({
  form,
  monthLabel,
  pioneerStart,
  onSave,
}: MinistryStatusFormProps) => {
  const t = useTranslations("screens.profile.ministrySheet");
  // The status names live where the pill in the hero reads them from, so
  // the panel and the pill cannot start saying different words.
  const statusName = useTranslations("screens.profile.ministryStatus");

  // Which row is picked right now — the goal field belongs to one of
  // them. useWatch rather than watch, so only this subtree re-renders
  // when the choice changes. Compared against the catalogue's own ids
  // below, never against a spelling written out here: how an id is built
  // is choices.ts's business, and a second place that knows is a second
  // place to fix.
  const pickedId = useWatch({ control: form.control, name: "choiceId" });

  return (
    // gap-3, because the panel around it sets the rhythm; ActionForm's own
    // default is for a screen.
    <ActionForm onSubmit={onSave} className="gap-3">
      <div className="flex flex-col gap-1">
        <SheetTitle className="text-day-title font-620 tracking-day-title text-ink">
          {t("title")}
        </SheetTitle>
        <p className="text-caption font-500 text-pretty text-ink-muted">
          {t("intro", { month: monthLabel })}
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
              <Fragment key={choice.id}>
                <Field
                  orientation="horizontal"
                  className={cn("items-center py-3.5", index > 0 && "border-t border-ink-a09")}
                >
                  <RadioGroupItem value={choice.id} id={fieldId(choice.id)} />
                  {/* items-start, because Label brings items-center with
                      it and a column under it would centre every line. */}
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

                {/* The goal belongs to the publisher's row, so it opens
                    under it rather than at the foot of the list — the
                    owner's design, and the shape GOV.UK calls a
                    conditional reveal. Indented by the radio's own width
                    plus the gap (16 + 8), so it lines up with the words
                    it belongs to.

                    The cost, said out loud: a text field inside
                    role="radiogroup" is not what that role describes. The
                    field keeps its own label and its description, so it
                    is announced correctly where it stands; what a screen
                    reader loses is the tidy "option 1 of 5" walk through
                    the group. Weighed against a number that appears four
                    rows away from the choice it belongs to, the owner
                    chose this, and it is the pattern the rest of the web
                    uses for the same question. */}
                {choice.status === "publisher" && choice.id === pickedId
                  ? (
                      <div className="mb-3.5 ml-6">
                        <GoalHoursField control={form.control} />
                      </div>
                    )
                  : null}

                {/* The pioneer's row asks one more thing, in the same
                    shape and the same place: since when. Only outside
                    September, where the question has two different
                    answers — pioneerStart is null otherwise and the row
                    stays as plain as the rest. */}
                {choice.status === "regular_pioneer"
                  && choice.id === pickedId
                  && pioneerStart !== null
                  ? (
                      <div className="mb-3.5 ml-6">
                        <PioneerStartField control={form.control} months={pioneerStart} />
                      </div>
                    )
                  : null}
              </Fragment>
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

      <SubmitButton
        variant="deep"
        isPending={form.isPending}
        isBlocked={form.hasErrors}
        className="w-full"
      >
        {t("save")}
      </SubmitButton>
    </ActionForm>
  );
};
