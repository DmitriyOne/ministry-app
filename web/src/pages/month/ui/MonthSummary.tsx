import { getTranslations } from "next-intl/server";

import { formatHours, MINUTES_IN_HOUR, splitDuration } from "@/entities/ministry-day";
import { Caption } from "@/shared/ui/caption";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { InfoHint } from "@/shared/ui/info-hint";
import { Progress } from "@/shared/ui/progress";

import type { MonthSummary as MonthSummaryData } from "../api/read-month-page";
import { monthStanding } from "../model/month-standing";

type MonthSummaryProps = {
  summary: MonthSummaryData;
};

type Translate = Awaited<ReturnType<typeof getTranslations<"screens.month.summary">>>;

const toGo = (t: Translate, remaining: number): string => {
  const { hours, minutes } = splitDuration(remaining);

  if (hours === 0) return t("toGoMinutes", { minutes });

  if (minutes === 0) return t("toGoHours", { hours });

  return t("toGoHoursMinutes", { hours, minutes });
};

// The month in one figure (the owner's choice on the canvas, variant B):
// a filled --hero card carrying what was served, the bar under it, and
// what is still owed; the service year follows on a quiet white line, so
// the two never compete for the same glance.
//
// Nothing is drawn against a goal nobody set. No month goal means no bar
// and no line under it, just the figure; no year goal means no year line
// at all, because that figure belongs to a regular pioneer and to nobody
// else, for as long as they are one (ADR 0061).
export const MonthSummary = async ({ summary }: MonthSummaryProps) => {
  const t = await getTranslations("screens.month.summary");
  const hint = await getTranslations("screens.month.hints.summary");
  const { totalMinutes, monthGoalHours, yearMinutes, yearGoalHours } = summary;
  const standing = monthGoalHours === null
    ? null
    : monthStanding(totalMinutes, monthGoalHours);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-4 rounded-2xl bg-hero px-5 py-6 text-hero-foreground">
        <div className="flex items-center justify-between gap-2">
          <Eyebrow className="text-hero-foreground/65">{t("label")}</Eyebrow>
          {/* On the filled card the sign takes the card's own tone: ink
              at 55% would be all but invisible on --hero. */}
          <InfoHint
            text={hint("text")}
            label={hint("label")}
            className="-mr-2 text-hero-foreground/65"
          />
        </div>

        <div className="flex items-baseline gap-2.5">
          <span className="text-totals font-620 tracking-screen-title">
            {formatHours(totalMinutes)}
          </span>
          {monthGoalHours === null
            ? null
            : (
                <Caption className="font-540 text-hero-foreground/72">
                  {t("ofGoal", { hours: monthGoalHours })}
                </Caption>
              )}
        </div>

        {monthGoalHours === null || standing === null
          ? null
          : (
              <div className="flex flex-col gap-2">
                <Progress
                  aria-label={t("barLabel")}
                  value={totalMinutes}
                  maxValue={monthGoalHours * MINUTES_IN_HOUR}
                  /* Minutes on both sides of the division, so the bar is
                     not told a number the card does not show. react-aria
                     clamps a value past the end, which is the honest
                     shape: once the month is done the bar is full and
                     the figure above keeps counting. */
                  valueLabel={t("barValue", {
                    served: formatHours(totalMinutes),
                    goal: monthGoalHours,
                  })}
                  className="[&_[data-slot=progress-indicator]]:bg-positive-hero [&_[data-slot=progress-track]]:bg-hero-foreground/18"
                />

                <Caption className="font-500 text-hero-foreground/72">
                  {/* Three phrasings rather than one with zeroes in it:
                      "28 h 0 min" and "0 h 15 min" are both longer and
                      harder to read than what they say (ADR 0064). */}
                  {standing.kind === "met" ? t("met") : toGo(t, standing.minutes)}
                </Caption>
              </div>
            )}
      </div>

      {yearGoalHours === null
        ? null
        : (
            <div className="flex items-baseline justify-between gap-3 rounded-2xl bg-card px-5 py-4 shadow-card">
              <Caption className="font-540 text-ink-muted">{t("serviceYear")}</Caption>
              <div className="flex items-baseline gap-1.5">
                <Caption className="font-600 text-ink">{formatHours(yearMinutes)}</Caption>
                <Caption className="font-500 text-ink-faint">
                  {t("serviceYearGoal", { hours: yearGoalHours })}
                </Caption>
              </div>
            </div>
          )}
    </section>
  );
};
