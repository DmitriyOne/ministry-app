import { getTranslations } from "next-intl/server";

import { durationPhrase, formatHours, MINUTES_IN_HOUR } from "@/entities/ministry-day";
import { Caption } from "@/shared/ui/caption";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Progress } from "@/shared/ui/progress";

import type { YearSummary as YearSummaryData } from "../api/read-year-page";
import { yearStanding } from "../model/year-standing";

type YearSummaryProps = {
  summary: YearSummaryData;
};

// The year in one figure: a filled --hero card carrying what was served,
// the bar under it, and what is still owed. The month screen's card
// without its second line — there is no larger period above a service
// year to put on a quiet white row beneath.
//
// Nothing is drawn against a goal nobody set. No goal means no bar and
// no line under it, just the figure: that number belongs to a regular
// pioneer and to nobody else, for as long as they are one (ADR 0061,
// applied here through visibleYearGoalHours in the reader).
export const YearSummary = async ({ summary }: YearSummaryProps) => {
  const t = await getTranslations("screens.year.summary");
  const { totalMinutes, goalHours } = summary;
  const standing = goalHours === null ? null : yearStanding(totalMinutes, goalHours);

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-hero px-5 py-6 text-hero-foreground">
      <Eyebrow className="text-hero-foreground/65">{t("label")}</Eyebrow>

      <div className="flex items-baseline gap-2.5">
        <span className="text-totals font-620 tracking-screen-title">
          {formatHours(totalMinutes)}
        </span>
        {goalHours === null
          ? null
          : (
              <Caption className="font-540 text-hero-foreground/72">
                {t("ofGoal", { hours: goalHours })}
              </Caption>
            )}
      </div>

      {goalHours === null || standing === null
        ? null
        : (
            <div className="flex flex-col gap-2">
              <Progress
                aria-label={t("barLabel")}
                value={totalMinutes}
                maxValue={goalHours * MINUTES_IN_HOUR}
                /* Minutes on both sides of the division, so the bar is
                   not told a number the card does not show. react-aria
                   clamps a value past the end, which is the honest
                   shape: once the year is done the bar is full and the
                   figure above keeps counting. */
                valueLabel={t("barValue", {
                  served: formatHours(totalMinutes),
                  goal: goalHours,
                })}
                className="[&_[data-slot=progress-indicator]]:bg-positive-hero [&_[data-slot=progress-track]]:bg-hero-foreground/18"
              />

              <Caption className="font-500 text-hero-foreground/72">
                {/* Words rather than a bracket, which is what keeps this
                    figure apart from the pace line below: here is what
                    is still owed, there is how far behind the calendar.
                    The same notation for both would be a third meaning
                    for one pair of brackets (ADR 0067, decision 6). */}
                {standing.kind === "met"
                  ? t("met")
                  : t("toGo", { amount: durationPhrase(t, standing.minutes) })}
              </Caption>
            </div>
          )}
    </section>
  );
};
