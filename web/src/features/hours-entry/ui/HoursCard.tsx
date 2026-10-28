"use client";

import { type ReactNode, useId } from "react";
import { useTranslations } from "next-intl";

import { type DayKey, formatHours } from "@/entities/ministry-day";
import { HapticButton } from "@/shared/ui/haptic-button";
import { CheckCircleIcon, MinusIcon, PlusIcon } from "@/shared/ui/icons";

import type { HoursSaveState } from "../model/hours-save";
import { useDayHours } from "../model/use-day-hours";
import { HoursCardShell } from "./HoursCardShell";
import {
  HOURS_QUICK_ADD_MINUTES,
  HOURS_STEP_MINUTES,
  wouldChange,
} from "../model/hours-value";

type HoursCardProps = {
  // Which day is being dialled. It comes from the address (ADR 0063),
  // and the card never asks the clock itself.
  day: DayKey;
  // What the database holds for that day. Zero both for a day recorded
  // as nothing and for a day with no row at all — the difference matters
  // to the table, not to this card (ADR 0062).
  savedMinutes: number;
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
export const HoursCard = ({ day, savedMinutes }: HoursCardProps) => {
  const t = useTranslations("screens.day.hours");
  const headingId = useId();
  const { change, isLocked, minutes, saveState } = useDayHours({ day, savedMinutes });

  // The header's right-hand slot, which the card already had: it says
  // what the buttons do, and while a save is away it says that instead.
  // Nothing moves, nothing covers the number, and there is no spinner —
  // this app has none anywhere (ADR 0055), and here there is nothing to
  // wait for either: the number is already the person's.
  //
  // A full map rather than two ternaries, so a fourth state cannot be
  // added without saying what it shows.
  const statusSlot: Record<HoursSaveState, ReactNode> = {
    idle: t("step", { minutes: HOURS_STEP_MINUTES }),
    saving: t("saving"),
    saved: (
      <span className="flex items-center gap-1">
        <CheckCircleIcon size={13} aria-hidden="true" />
        {t("saved")}
      </span>
    ),
  };

  // Not announced to a screen reader on purpose: the number itself
  // already sits in a live region and says what the tap did, and a
  // failure arrives as a toast, which sonner announces. A third voice
  // on every tap would be noise.
  return (
    <HoursCardShell
      headingId={headingId}
      label={t("label")}
      step={statusSlot[saveState]}
    >
      <div className="flex items-center justify-between gap-3.5">
        {/* HapticButton, not Button: these are the taps meant to be felt
            (ADR 0040). It takes one callback for both the finger and the
            keyboard, so there is nothing here to keep in sync. */}
        <HapticButton
          variant="heroGhost"
          className="size-14 rounded-full px-0"
          aria-label={t("decrease", { minutes: HOURS_STEP_MINUTES })}
          isDisabled={isLocked || !wouldChange(minutes, -HOURS_STEP_MINUTES)}
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
          isDisabled={isLocked || !wouldChange(minutes, HOURS_STEP_MINUTES)}
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
            isDisabled={isLocked || !wouldChange(minutes, delta)}
            onTap={() => change(delta)}
          >
            {t("quickAdd", { minutes: delta })}
          </HapticButton>
        ))}
      </div>
    </HoursCardShell>
  );
};
