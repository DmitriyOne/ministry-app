"use client";

import { useTranslations } from "next-intl";

import { type DayKey, formatHours } from "@/entities/ministry-day";
import { cn } from "@/shared/lib/cn";
import { HapticButton } from "@/shared/ui/haptic-button";

import { type CalendarWeek, DAYS_IN_WEEK } from "../model/calendar-grid";

type CalendarGridProps = {
  weeks: CalendarWeek[];
  today: DayKey | null;
  selected: DayKey | null;
  onSelect: (day: DayKey) => void;
};

// Monday first (ADR 0069, decision 7). Formatted data rather than
// interface text, like the weekday in a day heading — but written out
// here because these are the seven fixed column heads of a grid, and
// Intl would hand them back in an order this file would then have to
// rotate.
const WEEKDAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

const SQUARE = "flex aspect-square flex-col items-center justify-center gap-1 rounded-sm p-0 text-list-row font-560 tabular-nums [--press-scale:0.92]";

// The month as a grid of squares, one per day, blanks where the month
// has not begun or has already ended.
//
// A square is a BUTTON, not a link: pressing it selects the day and the
// card below answers. The link to the day itself is in that card, where
// it can say what it opens — a grid of thirty links to thirty days
// would read to a screen reader as thirty identical destinations.
//
// Three things are told apart, and none of them by colour alone: a day
// with something recorded carries a dot, the day being lived carries a
// ring, and the selected day is filled. Each also lands in the square's
// accessible name.
export const CalendarGrid = ({ weeks, today, selected, onSelect }: CalendarGridProps) => {
  const t = useTranslations("screens.calendar");

  return (
    <div className="rounded-2xl bg-card px-3 pt-3.5 pb-4 shadow-card">
      <div className="mb-1.5 grid grid-cols-7 gap-0.5" aria-hidden="true">
        {WEEKDAY_KEYS.map((key) => (
          <span
            key={key}
            className="text-center text-eyebrow font-620 text-ink-a55"
          >
            {t(`weekdays.${key}`)}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, index) => week.map((square, slot) => {
          if (square === null) {
            // A slot outside the month: no number, no target, and
            // nothing announced. The key is the position, which is the
            // only thing it has.
            return <div key={`blank-${index * DAYS_IN_WEEK + slot}`} aria-hidden="true" />;
          }

          const isToday = square.day === today;
          const isSelected = square.day === selected;
          const served = square.minutes === null
            ? t("squareEmpty")
            : formatHours(square.minutes);

          return (
            <HapticButton
              key={square.day}
              variant="plain"
              radius="sm"
              onTap={() => onSelect(square.day)}
              aria-pressed={isSelected}
              // The number alone would read as "4", which in a grid of
              // numbers says nothing about which 4 or what is in it.
              aria-label={`${square.dayOfMonth}, ${served}`}
              className={cn(
                SQUARE,
                "bg-transparent shadow-none",
                square.minutes !== null && !isSelected && "bg-ink-a05",
                isToday && !isSelected && "inset-ring-1.5 inset-ring-primary",
                isSelected && "bg-ink text-hero-foreground",
              )}
            >
              <span>{square.dayOfMonth}</span>
              {/* The dot says "something is recorded here", including a
                  recorded zero — the distinction the whole grid rests
                  on. Decorative: the figure is already in the label
                  above. */}
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full",
                  square.minutes === null
                    ? "bg-transparent"
                    : isSelected ? "bg-hero-foreground" : "bg-primary",
                )}
              />
            </HapticButton>
          );
        }))}
      </div>
    </div>
  );
};
