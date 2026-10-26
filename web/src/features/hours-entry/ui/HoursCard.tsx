"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";

import type { DayKey } from "@/entities/ministry-day";
import { HapticButton } from "@/shared/ui/haptic-button";
import { MinusIcon, PlusIcon } from "@/shared/ui/icons";

import { useDayHours } from "../model/use-day-hours";
import { HoursCardShell } from "./HoursCardShell";
import {
  formatHours,
  HOURS_QUICK_ADD_MINUTES,
  HOURS_STEP_MINUTES,
  wouldChange,
} from "../model/hours-value";

type HoursCardProps = {
  // Which day is being dialled. The screen decides it, from the person's
  // own calendar, and the card never asks the clock itself.
  day: DayKey;
  // What the database holds for that day. Zero both for a day recorded
  // as nothing and for a day with no row at all — the difference matters
  // to the table, not to this card (ADR 0062).
  savedMinutes: number;
  // The calendar the day was named in. The card does not read it to
  // show anything — it reads it to notice that the day has turned over
  // while the screen stayed open (ADR 0062).
  timeZone: string | null;
};

// The hours served on one day, dialled by hand — the one interactive
// island on /day, which stays a server component around it.
//
// It saves itself now (ADR 0062). Until 2.3 it kept nothing at all: the
// number lived in React state and a reload put it back to zero (ADR
// 0060), because the card existed to settle the shape of the control
// before there was a table to write into. There is one now, so every tap
// goes to the server — debounced, rolled back if it does not land, and
// without a Save button (the owner's rule).
//
// Everything this component decides is one line long, because the
// decisions are not here: the step, the quick-add row, the cap and
// whether a button has anywhere to go come from ../model/hours-value,
// and when and how a tap is saved comes from ../model/use-day-hours.
// What is left is markup.
export const HoursCard = ({ day, savedMinutes, timeZone }: HoursCardProps) => {
  const t = useTranslations("screens.day.hours");
  const headingId = useId();
  const { change, minutes } = useDayHours({ day, savedMinutes, timeZone });

  return (
    <HoursCardShell
      headingId={headingId}
      label={t("label")}
      step={t("step", { minutes: HOURS_STEP_MINUTES })}
    >
      <div className="flex items-center justify-between gap-3.5">
        {/* HapticButton, not Button: these are the taps meant to be felt
            (ADR 0040). It takes one callback for both the finger and the
            keyboard, so there is nothing here to keep in sync. */}
        <HapticButton
          variant="heroGhost"
          className="size-14 rounded-full px-0"
          aria-label={t("decrease", { minutes: HOURS_STEP_MINUTES })}
          isDisabled={!wouldChange(minutes, -HOURS_STEP_MINUTES)}
          onTap={() => change(-HOURS_STEP_MINUTES)}
        >
          <MinusIcon size={28} />
        </HapticButton>

        {/* Announced rather than silent: the buttons say what they do, but
            what the number BECAME is the answer to the tap, and a screen
            reader would otherwise never hear it. The live region stays
            mounted and only the number inside is keyed, so each change
            replays the bump without the region being torn down. */}
        <span aria-live="polite" className="text-display font-600 tracking-display tabular-nums">
          <span key={minutes} className="inline-block motion-safe:animate-value-bump">
            {formatHours(minutes)}
          </span>
        </span>

        <HapticButton
          variant="action"
          className="size-14 rounded-full px-0"
          aria-label={t("increase", { minutes: HOURS_STEP_MINUTES })}
          isDisabled={!wouldChange(minutes, HOURS_STEP_MINUTES)}
          onTap={() => change(HOURS_STEP_MINUTES)}
        >
          <PlusIcon size={28} />
        </HapticButton>
      </div>

      {/* A grid of equal columns rather than flex-1 on each child: the
          three are the same size by definition, and this way the buttons
          need nothing said about how they share the row. */}
      <div className="grid grid-cols-3 gap-2">
        {HOURS_QUICK_ADD_MINUTES.map((delta) => (
          <HapticButton
            key={delta}
            radius="sm"
            variant="heroGhost"
            className="h-10 w-full rounded-sm px-0 text-sm font-560"
            isDisabled={!wouldChange(minutes, delta)}
            onTap={() => change(delta)}
          >
            {t("quickAdd", { minutes: delta })}
          </HapticButton>
        ))}
      </div>
    </HoursCardShell>
  );
};
