"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { type Control, Controller } from "react-hook-form";

import { Field, FieldLabel } from "@/shared/ui/field";
import { RadioGroup, RadioGroupItem } from "@/shared/ui/radio-group";

import type { MinistryChoiceValues } from "../model/schema";

type PioneerStartFieldProps = {
  control: Control<MinistryChoiceValues>;
  // Both months already in words, from the hook, so this component owns
  // no calendar: "September 2026" and "February 2027" — and what the
  // year comes to under each of them.
  months: {
    serviceYear: string;
    currentMonth: string;
    yearGoalHours: { serviceYear: number; currentMonth: number };
  };
};

// The sub-question under the regular pioneer's row: since when.
//
// It exists because of how the year is counted. A pioneer is measured
// against 600 hours over the service year, and the database works that
// out by adding up the months they were a pioneer in — so somebody who
// only tells the app in February would be counted against six months,
// not twelve, and their year's goal would read as a number nobody
// recognises (ADR 0061, update 2026-10-29).
//
// Only this row asks it. The other statuses have no year to add up: the
// publisher's goal is their own, and both auxiliary rows are months
// rather than years. And it is asked only outside September — in
// September the two answers are one statement, and the sheet leaves the
// question out entirely rather than offering a choice that is not one.
//
// Shaped like GoalHoursField beside it, and for the same reasons: the
// answer belongs to one row, so it opens under that row (the shape
// GOV.UK calls a conditional reveal), and it pays the same price — a
// second radiogroup nested inside the first is not what that role
// describes. Its own label names it, so it is announced correctly where
// it stands; what is lost is the tidy "option 1 of 5" walk.
export const PioneerStartField = ({ control, months }: PioneerStartFieldProps) => {
  const t = useTranslations("screens.profile.ministrySheet.since");
  const serviceYearId = useId();
  const currentMonthId = useId();
  const hintId = useId();

  return (
    <Controller
      name="startFrom"
      control={control}
      render={({ field }) => (
        <RadioGroup
          value={field.value}
          onChange={field.onChange}
          aria-label={t("legend")}
          aria-describedby={hintId}
          className="gap-2.5"
        >
          <p className="text-caption font-540 text-ink">{t("legend")}</p>

          <Field orientation="horizontal" className="items-center">
            <RadioGroupItem value="service_year" id={serviceYearId} />
            <FieldLabel
              htmlFor={serviceYearId}
              className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
            >
              <span className="text-body font-540 text-ink">{t("serviceYear")}</span>
              <span className="text-caption font-500 text-ink-muted">{months.serviceYear}</span>
            </FieldLabel>
          </Field>

          <Field orientation="horizontal" className="items-center">
            <RadioGroupItem value="current" id={currentMonthId} />
            <FieldLabel
              htmlFor={currentMonthId}
              className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left"
            >
              <span className="text-body font-540 text-ink">{t("currentMonth")}</span>
              <span className="text-caption font-500 text-ink-muted">{months.currentMonth}</span>
            </FieldLabel>
          </Field>

          {/* The figure the answer leads to, and it moves with the
              answer: 600 only from September, one month less for every
              month after it. Written out because the two rows above
              differ by exactly one month, and a month is not a number
              anybody converts in their head. */}
          <p id={hintId} className="text-caption font-500 text-pretty text-ink-muted">
            {t("hint", {
              hours: field.value === "service_year"
                ? months.yearGoalHours.serviceYear
                : months.yearGoalHours.currentMonth,
            })}
          </p>
        </RadioGroup>
      )}
    />
  );
};
