"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { Caption } from "@/shared/ui/caption";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { HapticButton } from "@/shared/ui/haptic-button";
import { MinusIcon, PlusIcon } from "@/shared/ui/icons";

import {
  addMinutes,
  formatHours,
  HOURS_QUICK_ADD_MINUTES,
  HOURS_STEP_MINUTES,
  wouldChange,
} from "../model/hours-value";

// Today's hours, dialled by hand — the one interactive island on /day,
// which stays a server component around it.
//
// It remembers nothing on purpose (ADR 0060): the number lives in React
// state, a reload puts it back to zero, and neither the profile nor any
// total hears about it. The screen exists to settle the shape of the
// control — the step, the cap, the feel of a tap — before there is a
// table to write into.
//
// Everything this component decides is one line long, because the
// decisions are not here: the step, the quick-add row, the cap and
// whether a button has anywhere to go all come from ../model, where they
// are covered by tests. What is left is markup and one piece of state.
export const HoursCard = () => {
  const t = useTranslations("screens.day.hours");
  const headingId = useId();
  const [minutes, setMinutes] = useState(0);

  const add = (delta: number) => setMinutes((current) => addMinutes(current, delta));

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4.5 rounded-2xl bg-hero px-5.5 pt-5.5 pb-4.5 text-hero-foreground"
    >
      <div className="flex items-center justify-between gap-3">
        <Eyebrow as="h2" id={headingId} className="text-white/50">
          {t("label")}
        </Eyebrow>
        <Caption className="text-white/50">{t("step", { minutes: HOURS_STEP_MINUTES })}</Caption>
      </div>

      <div className="flex items-center justify-between gap-3.5">
        {/* HapticButton, not Button: these are the taps meant to be felt
            (ADR 0040). It takes one callback for both the finger and the
            keyboard, so there is nothing here to keep in sync. */}
        <HapticButton
          variant="heroGhost"
          className="size-14 rounded-full px-0"
          aria-label={t("decrease", { minutes: HOURS_STEP_MINUTES })}
          isDisabled={!wouldChange(minutes, -HOURS_STEP_MINUTES)}
          onTap={() => add(-HOURS_STEP_MINUTES)}
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
          onTap={() => add(HOURS_STEP_MINUTES)}
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
            onTap={() => add(delta)}
          >
            {t("quickAdd", { minutes: delta })}
          </HapticButton>
        ))}
      </div>
    </section>
  );
};
