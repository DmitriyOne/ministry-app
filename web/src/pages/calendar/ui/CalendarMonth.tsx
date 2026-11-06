"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { type DayKey } from "@/entities/ministry-day";

import {
  type CalendarDay,
  calendarDays,
  type CalendarWeek,
} from "../model/calendar-grid";
import { CalendarDayCard } from "./CalendarDayCard";
import { CalendarGrid } from "./CalendarGrid";

type CalendarMonthProps = {
  weeks: CalendarWeek[];
  // The day this person is in, marked in the grid. Null when the zone
  // did not read: no square is marked, and nothing opens selected.
  today: DayKey | null;
  initialSelected: DayKey | null;
};

// The one client piece of this screen: which square is selected, and the
// card that answers for it.
//
// The selection is state rather than an address (ADR 0069, decision 5).
// The month decides what to READ, so it lives in the path; picking a
// square reads nothing — every figure the card shows is already in
// `weeks` — and putting it in the path would pay a navigation for a
// highlight.
//
// The card is rendered here rather than passed in: it has to change with
// the selection, and a server-rendered one could not.
export const CalendarMonth = ({ weeks, today, initialSelected }: CalendarMonthProps) => {
  const t = useTranslations("screens.calendar");
  const [selected, setSelected] = useState<DayKey | null>(initialSelected);
  const day: CalendarDay | null
    = calendarDays(weeks).find((square) => square.day === selected) ?? null;

  return (
    <>
      <CalendarGrid
        weeks={weeks}
        today={today}
        selected={selected}
        onSelect={setSelected}
      />

      {day === null
        ? (
            <p className="px-1 text-caption font-500 text-pretty text-ink-muted">
              {t("pickADay")}
            </p>
          )
        : <CalendarDayCard day={day} />}
    </>
  );
};
