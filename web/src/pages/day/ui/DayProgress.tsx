import { getTranslations } from "next-intl/server";

import { formatHours } from "@/entities/ministry-day";
import { formatMonthName } from "@/entities/ministry-status";
import { Caption } from "@/shared/ui/caption";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { cn } from "@/shared/lib/cn";
import { Progress } from "@/shared/ui/progress";

import type { DayProgress as DayProgressData } from "../api/read-day-page";
import { goalStanding, splitDuration } from "../model/goal-standing";

const MINUTES_IN_HOUR = 60;

// A constant, not useId: this is a server component, and there is one
// progress block on the screen — the day's hours card uses a generated
// id because it is a client island and may not be alone on a page one
// day.
const HEADING_ID = "day-progress-heading";

// The month's bar is --primary and the service year's is the deeper
// --hero: the same pair, in the same order, as the two goal plates on
// /profile. Set through the indicator's data-slot rather than by giving
// the registry's component a tone prop — the vendored file stays what
// the registry wrote (shared/ui/progress.tsx).
const INDICATOR_TONE = {
  primary: "",
  hero: "[&_[data-slot=progress-indicator]]:bg-hero",
} as const;

// Short of the goal is --negative, level with it or past it is the
// project's green. The owner's mock-ups (2026-10-28) call for the red.
const STANDING_TONE = {
  met: "text-primary",
  short: "text-negative",
} as const;

type Standing = { text: string; tone: keyof typeof STANDING_TONE };

type ProgressRowProps = {
  label: string;
  minutes: number;
  // Null is "no goal", and it is an answer rather than a gap: a
  // publisher who has set none (ADR 0061) — the read already turns that
  // answer's zero into null. The row then shows the total, with no bar
  // and no bracket: both would have to pick a goal nobody set.
  goalHours: number | null;
  standing: Standing | null;
  goalLabel: (hours: number) => string;
  barLabel: string;
  barValue: (served: string, goal: number) => string;
  tone?: keyof typeof INDICATOR_TONE;
};

const ProgressRow = ({
  label,
  minutes,
  goalHours,
  standing,
  goalLabel,
  barLabel,
  barValue,
  tone = "primary",
}: ProgressRowProps) => (
  <div className="flex flex-col gap-2 pt-1">
    <div className="flex items-baseline justify-between gap-2">
      <Caption className="font-560 text-ink-muted">
        {goalHours === null ? label : `${label} · ${goalLabel(goalHours)}`}
      </Caption>

      <div className="flex items-baseline gap-1.5">
        <Caption className="font-600 text-ink">{formatHours(minutes)}</Caption>
        {standing === null
          ? null
          : (
              <Caption className={cn("font-600", STANDING_TONE[standing.tone])}>
                {standing.text}
              </Caption>
            )}
      </div>
    </div>

    {goalHours === null
      ? null
      : (
          <Progress
            aria-label={barLabel}
            value={minutes}
            maxValue={goalHours * MINUTES_IN_HOUR}
            /* Minutes on both sides of the division, so the bar is not
               told a number the row does not show: the goal is in whole
               hours, the total in minutes, and rounding hours out here
               would lose the very fraction the bar exists to draw. The
               range cannot be zero: a goal of zero hours never reaches
               this row — the read turns it into "no goal" (ADR 0064,
               decision 5), and the database allows nothing between 0 and
               1 anyway.

               Hours beyond the goal do not push past the end: react-aria
               clamps the value into the range (measured in
               useProgressBar), and that is the honest shape. The bar
               answers "is the month done", and once it is, it is full;
               the figure beside it keeps counting.

               The bar and the bracket beside it measure the same
               thing — the whole goal — and say it two ways: the bar
               shows how much is done, the bracket how much is left.

               valueLabel is not drawn anywhere — it is what a screen
               reader says instead of the default "76%", which is true
               but tells nobody how many hours that is. */
            valueLabel={barValue(formatHours(minutes), goalHours)}
            className={INDICATOR_TONE[tone]}
          />
        )}
  </div>
);

type DayProgressProps = {
  progress: DayProgressData;
};

// How far through the month, and through the service year, this person
// is. Two rows, each a line of text with a thin bar under it — the
// owner's option A (ADR 0064).
//
// Here rather than in a widget of its own: this has exactly one caller,
// and FSD v2.1 keeps code where it is used until there is real reuse.
// When the month screen wants the same two rows, that is the moment to
// extract them — not now, on a guess about which shape it will want.
//
// A server component, like the rest of the screen: the sums come from
// the database and every figure here is worked out while the page
// renders. Only the bar is a client leaf, because react-aria is what
// turns a value into `role="progressbar"` with `aria-valuenow` — the
// same arrangement as FooterLink inside ScreenFooter.
//
// The month is the OPEN day's month, not the month the phone is in: open
// 15 September and this answers for September (ADR 0064). It also means
// the block needs no clock of its own, so its reads run beside the
// card's instead of behind a time zone.
export const DayProgress = async ({ progress }: DayProgressProps) => {
  // No goal of any kind — no block at all (the owner, 2026-10-28). What
  // was left of it in that case was a heading, a month's name and a
  // figure measured against nothing: a "Progress" with nothing to
  // progress towards. Somebody who has set no goal has not asked this
  // question, and the hours they served are already on the card above.
  if (progress.monthGoalHours === null && progress.yearGoalHours === null) return null;

  const t = await getTranslations("screens.day.progress");
  // Hoisted, because both rows say the goal and the bar's value the same
  // way: the row decides WHETHER to say them, the dictionary how.
  const goalLabel = (hours: number) => t("goal", { hours });
  const barValue = (served: string, goal: number) => t("barValue", { served, goal });

  // "1 h 30 min", "15 min", "134 h" — spelled out rather than as a clock
  // (the owner's mock-ups). A difference is not a time of day, and
  // "−1:30" beside "0:30" would be two numbers of the same shape meaning
  // different things.
  const amount = (total: number) => {
    const { hours, minutes } = splitDuration(total);

    if (hours === 0) return t("minutes", { minutes });

    if (minutes === 0) return t("hours", { hours });

    return t("hoursMinutes", { hours, minutes });
  };

  // The bracket: how this total stands against the WHOLE goal — what is
  // still owed, or by how much it is beaten (ADR 0064, decision 10).
  //
  // Against the whole goal, and not against the share of it due by
  // today, which is what this said until the owner saw the result on 28
  // October: "1:50 (−25 h 16 min)". Both the odd minutes (a goal divided
  // by the days of the month rarely lands on one) and the hidden
  // reference point made it a number to decipher rather than read. A
  // monthly goal is a figure people already keep in their heads; this
  // bracket now says the plain rest of it.
  //
  // Level says "(+0)" rather than "+0 min" — the owner's mock-up, and it
  // reads as a state rather than as a measurement of nothing.
  const standing = (served: number, goalHours: number): Standing => {
    const against = goalStanding(served, goalHours);

    if (against.kind === "level") return { text: t("level"), tone: "met" };

    if (against.kind === "ahead") {
      return { text: t("ahead", { amount: amount(against.minutes) }), tone: "met" };
    }

    return { text: t("behind", { amount: amount(against.minutes) }), tone: "short" };
  };

  return (
    // Named by its own heading, like the hours card above it: a section
    // without one is an unlabelled region, which a screen reader
    // announces as nothing in particular.
    <section aria-labelledby={HEADING_ID} className="flex flex-col gap-2.5 px-1">
      <Eyebrow as="h2" id={HEADING_ID}>{t("label")}</Eyebrow>

      <ProgressRow
        label={formatMonthName(progress.month)}
        minutes={progress.monthMinutes}
        goalHours={progress.monthGoalHours}
        standing={progress.monthGoalHours === null
          ? null
          : standing(progress.monthMinutes, progress.monthGoalHours)}
        goalLabel={goalLabel}
        barLabel={t("monthBar")}
        barValue={barValue}
      />

      {/* No service year row at all without a year's goal (the owner,
          2026-10-28). A goal for the year exists for a regular pioneer
          and for nobody else (ADR 0061), so for everybody else the line
          would be a heading over a figure nothing measures — and it
          would say "Service year" to people for whom this app has no
          such thing to say. The month's row stays either way: hours
          served in a month are worth seeing with or without a goal. */}
      {progress.yearGoalHours === null
        ? null
        : (
            <ProgressRow
              label={t("year")}
              minutes={progress.yearMinutes}
              goalHours={progress.yearGoalHours}
              standing={standing(progress.yearMinutes, progress.yearGoalHours)}
              goalLabel={goalLabel}
              barLabel={t("yearBar")}
              barValue={barValue}
              tone="hero"
            />
          )}
    </section>
  );
};
