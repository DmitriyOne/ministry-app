import { getTranslations } from "next-intl/server";

import { type DayKey, durationPhrase, formatHours } from "@/entities/ministry-day";
import type { MonthKey } from "@/entities/ministry-status";
import { cn } from "@/shared/lib/cn";
import { Caption } from "@/shared/ui/caption";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { InfoHint } from "@/shared/ui/info-hint";
import { Progress } from "@/shared/ui/progress";

import { monthPace } from "../model/month-pace";

// A constant, not useId: a server component, and there is one pace block
// on the screen.
const HEADING_ID = "month-pace-heading";

type MonthPaceProps = {
  month: MonthKey;
  // Null when the person's calendar did not read — the model then says
  // nothing at all, rather than guessing the day.
  today: DayKey | null;
  servedMinutes: number;
  goalHours: number | null;
};

// Whether the month is keeping up with its own calendar.
//
// Built in the shape of the day screen's progress block — a line of text
// with a thin bar under it — because the owner asked for exactly that
// (2026-11-02), having turned down the first attempt: a rule and two
// rows inside the dark summary card, which read as a second card stuck
// to the bottom of the first.
//
// Not shared code with DayProgress, though it is the same shape: that
// block lives in pages/day, and one page may not import another's
// internals (FSD). The duplication is the layer rule's price and it is
// named in ADR 0066; what the two DO share is the entity's phrasing of a
// span of time, which moved into ministry-day for this.
//
// The bar measures against what TODAY asks for, not against the whole
// goal — the goal's own bar is in the card above, and two bars for the
// same fraction would be one bar too many. react-aria clamps a value
// past the end, so being ahead fills it and the figure beside it keeps
// the number.
export const MonthPace = async ({ month, today, servedMinutes, goalHours }: MonthPaceProps) => {
  const pace = monthPace({ month, today, servedMinutes, goalHours });

  if (pace === null) return null;

  const t = await getTranslations("screens.month.pace");
  const hint = await getTranslations("screens.month.hints.pace");
  const needed = durationPhrase(t, pace.neededMinutes);

  return (
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-2.5 px-1">
      <div className="flex items-center justify-between gap-2">
        <Eyebrow as="h2" id={HEADING_ID}>{t("label")}</Eyebrow>
        <InfoHint text={hint("text")} label={hint("label")} className="-mr-2" />
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <div className="flex items-baseline justify-between gap-2">
          <Caption className="font-560 text-ink-muted">
            {t("byDay", { day: pace.dayOfMonth, amount: needed })}
          </Caption>

          <div className="flex items-baseline gap-1.5">
            <Caption className="font-600 text-ink">{formatHours(servedMinutes)}</Caption>
            {/* Behind is --negative, level or ahead the project's green —
                the same pair, in the same places, as the day screen's
                bracket. */}
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
             returns nothing without a goal, and the first day of a month
             already asks for a share of it. */
          valueLabel={t("barValue", { served: formatHours(servedMinutes), needed })}
        />
      </div>

      {/* What it takes from here, which is the question "am I behind"
          turns into. Gone once the goal is reached: there is nothing
          left to keep up, and the card above already says so. */}
      {pace.rest === null
        ? null
        : (
            <Caption className="font-500 text-ink-muted">
              {t("rest", {
                amount: durationPhrase(t, pace.rest.perDayMinutes),
                days: pace.rest.days,
              })}
            </Caption>
          )}
    </section>
  );
};
