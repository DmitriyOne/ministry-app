import { getTranslations } from "next-intl/server";

import { type DayKey, durationPhrase, formatHours } from "@/entities/ministry-day";
import { cn } from "@/shared/lib/cn";
import { Caption } from "@/shared/ui/caption";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { Progress } from "@/shared/ui/progress";

import type { YearMonthRow } from "../model/year-months";
import { yearPace } from "../model/year-pace";

// A constant, not useId: a server component, and there is one pace block
// on the screen.
const HEADING_ID = "year-pace-heading";

type YearPaceProps = {
  today: DayKey | null;
  servedMinutes: number;
  goalHours: number | null;
  months: YearMonthRow[] | null;
};

// Whether the service year is keeping up with its own calendar, in the
// shape of the month's pace block — which is itself the shape of the day
// screen's progress block, where the owner asked for this to live.
//
// What is NOT the month's is the arithmetic, and it matters: the year's
// goal is a sum of monthly goals rather than a flat figure, so the line
// is measured in months (ADR 0067, decision 5). The model does that; all
// this file does is say it.
//
// The bar measures against what TODAY asks for, not against the whole
// goal — the goal's own bar is in the card above, and two bars for the
// same fraction would be one bar too many.
export const YearPace = async ({
  today,
  servedMinutes,
  goalHours,
  months,
}: YearPaceProps) => {
  const pace = yearPace({
    today,
    servedMinutes,
    goalHours,
    months: months === null
      ? null
      : months.map((row) => ({ month: row.month, goalHours: row.goalHours })),
  });

  if (pace === null) return null;

  const t = await getTranslations("screens.year.pace");
  const needed = durationPhrase(t, pace.neededMinutes);

  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-2.5 px-1">
      <Eyebrow as="h2" id={HEADING_ID}>{t("label")}</Eyebrow>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-baseline justify-between gap-2">
          <Caption className="font-560 text-ink-muted">
            {t("byToday", { amount: needed })}
          </Caption>

          <div className="flex items-baseline gap-1.5">
            <Caption className="font-600 text-ink">{formatHours(servedMinutes)}</Caption>
            {/* Behind is --negative, level or ahead the project's green —
                the same pair, in the same places, as the month's pace
                line and the day screen's bracket. */}
            <Caption
              className={cn(
                "font-600",
                pace.standing.kind === "behind" ? "text-negative" : "text-primary",
              )}
            >
              {pace.standing.kind === "level"
                ? t("level")
                : t(pace.standing.kind === "ahead" ? "ahead" : "behind", {
                    amount: durationPhrase(t, pace.standing.minutes),
                  })}
            </Caption>
          </div>
        </div>

        <Progress
          aria-label={t("bar")}
          value={servedMinutes}
          maxValue={pace.neededMinutes}
          /* Minutes on both sides, so the bar is not told a number the
             line does not show. The range cannot be zero: the model
             returns nothing without a goal, and the first day of a
             service year already asks for a share of it. */
          valueLabel={t("barValue", { served: formatHours(servedMinutes), needed })}
        />
      </div>

      {/* What it takes from here, which is the question "am I behind"
          turns into — per MONTH, because a rate per day across a year is
          a figure nobody uses. Gone once the goal is reached: there is
          nothing left to keep up, and the card above already says so. */}
      {pace.rest === null
        ? null
        : (
            <Caption className="font-500 text-ink-muted">
              {t("rest", {
                amount: durationPhrase(t, pace.rest.perMonthMinutes),
                months: pace.rest.months,
              })}
            </Caption>
          )}
    </section>
  );
};
