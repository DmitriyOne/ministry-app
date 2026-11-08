"use client";

import { useTranslations } from "next-intl";

import {
  dayPath,
  formatDayAndMonth,
  formatDayWeekday,
  formatHours,
} from "@/entities/ministry-day";
import { LinkButton } from "@/shared/ui/button";
import { Caption } from "@/shared/ui/caption";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { InfoHint } from "@/shared/ui/info-hint";

import type { CalendarDay } from "../model/calendar-grid";

type CalendarDayCardProps = {
  day: CalendarDay;
};

const TILE = "flex flex-1 flex-col gap-1.5 rounded-lg bg-white/8 px-3.5 py-3";
const TILE_VALUE = "text-day-title font-620 tabular-nums";

// What the selected square holds, in the owner's layout: a filled --hero
// card with the date, two tiles and the way into the day itself (ADR
// 0069, decision 4).
//
// The two tiles answer two different questions, which is the whole
// reason there are two: HOURS is this day, MONTH BY THEN is what the
// month came to by the end of it — the figure the month screen's third
// column carries. "The whole month" would be the same number whichever
// square was picked, and so would say nothing about the day.
//
// The mock's third tile, Bible studies, is not drawn: this app records
// no studies at all (the owner removed them in 2.5), and a tile with a
// dash in it promises something the app cannot do.
//
// A day with nothing recorded is not a zero. It says so in words and
// still opens — that is the day somebody came here to fill in.
export const CalendarDayCard = ({ day }: CalendarDayCardProps) => {
  const t = useTranslations("screens.calendar.dayCard");
  const hint = useTranslations("screens.calendar.hints.dayCard");
  const isEmpty = day.minutes === null;

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-hero px-5 py-5 text-hero-foreground">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-day-title font-600 tracking-screen-title">
          {formatDayAndMonth(day.day)}
        </h2>
        <div className="flex shrink-0 items-center gap-1">
          <Caption className="font-500 text-hero-foreground/55">
            {formatDayWeekday(day.day)}
          </Caption>
          <InfoHint
            text={hint("text")}
            label={hint("label")}
            surface="dark"
            className="-mr-2"
          />
        </div>
      </div>

      {isEmpty
        ? (
            <div className="flex flex-col gap-1 rounded-lg bg-white/8 px-4 py-3.5">
              <span className="text-list-row font-560">{t("emptyTitle")}</span>
              <Caption className="font-500 text-pretty text-hero-foreground/65">
                {t("emptyText")}
              </Caption>
            </div>
          )
        : (
            <div className="flex gap-2.5">
              <div className={TILE}>
                <Eyebrow className="text-hero-foreground/55">{t("hours")}</Eyebrow>
                <span className={TILE_VALUE}>{formatHours(day.minutes ?? 0)}</span>
              </div>
              <div className={TILE}>
                <Eyebrow className="text-hero-foreground/55">{t("monthByThen")}</Eyebrow>
                <span className={`${TILE_VALUE} text-positive-hero`}>
                  {formatHours(day.runningMinutes)}
                </span>
              </div>
            </div>
          )}

      {/* A link, not a button: it goes to another screen, so the back
          gesture and "open in a new tab" have to work (ADR 0069,
          decision 10). */}
      <LinkButton href={dayPath(day.day)} variant="action" size="role" className="w-full">
        {isEmpty ? t("addHours") : t("openDay")}
      </LinkButton>
    </section>
  );
};
