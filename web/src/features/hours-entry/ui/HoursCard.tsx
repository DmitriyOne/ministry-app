"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/shared/ui/button";
import { Caption } from "@/shared/ui/caption";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { HapticTap } from "@/shared/ui/haptic-tap";
import { MinusIcon, PlusIcon } from "@/shared/ui/icons";

import {
  addMinutes,
  formatHours,
  HOURS_QUICK_ADD_MINUTES,
  HOURS_STEP_MINUTES,
} from "../model/hours-value";

// Today's hours, dialled by hand. The one interactive island on /day,
// which stays a server component around it.
//
// It remembers nothing on purpose (ADR 0060): the number lives in React
// state and a reload puts it back to zero. The screen exists to settle the
// shape of the control — the step, the cap, the feel of the tick — before
// there is a table to write it into, and nothing here touches the profile
// or the totals.
//
// Every one of the five buttons is wrapped in HapticTap, which is what
// produces the system tick on a real touch (ADR 0040). Note that each
// handler is given twice, to the overlay and to the button: the overlay is
// the finger's path, the button is the keyboard's and VoiceOver's, and one
// gesture can only reach one of them.
const SURFACE_INK = "text-white/50";
const BONE_ON_HERO = "bg-white/12";

// How hard a press reads. The haptic tick's own strength is not ours to
// choose — WebKit picks the style, and no API asks for "harder" (ADR
// 0040) — so the part that can be made more emphatic is what happens
// under the finger at the same moment: a deeper squeeze than the app's
// usual 0.98, a quicker one than its 150ms, and a brightening that the
// `.haptic-tap` rule in globals.css drives from the overlay, because the
// button itself never sees :active.
//
// 0.9 is not a new value in the project — the password field's toggle
// already presses that far (ADR 0012). It is simply the deepest of them,
// which is what 56px circles meant to feel like keys should be, as
// opposed to a row in a card at 0.98.
const PRESS_FEEL = "duration-75 [--press-brightness:1.18] [--press-scale:0.9]";

export const HoursCard = () => {
  const t = useTranslations("screens.day.hours");
  const headingId = useId();
  const [minutes, setMinutes] = useState(0);

  const add = (delta: number) => setMinutes((current) => addMinutes(current, delta));

  // Disabled where the tap would change nothing: at zero going down, and
  // at the cap going up. Asked of the same function that does the adding,
  // so the button and the arithmetic cannot disagree about the edges.
  const changes = (delta: number) => addMinutes(minutes, delta) !== minutes;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-4.5 rounded-2xl bg-hero px-5.5 pt-5.5 pb-4.5 text-hero-foreground"
    >
      <div className="flex items-center justify-between gap-3">
        <Eyebrow as="h2" id={headingId} className={SURFACE_INK}>
          {t("label")}
        </Eyebrow>
        <Caption className={SURFACE_INK}>{t("step", { minutes: HOURS_STEP_MINUTES })}</Caption>
      </div>

      <div className="flex items-center justify-between gap-3.5">
        <HapticTap
          radius="full"
          isDisabled={!changes(-HOURS_STEP_MINUTES)}
          onTap={() => add(-HOURS_STEP_MINUTES)}
        >
          <Button
            variant="heroGhost"
            aria-label={t("decrease", { minutes: HOURS_STEP_MINUTES })}
            isDisabled={!changes(-HOURS_STEP_MINUTES)}
            onPress={() => add(-HOURS_STEP_MINUTES)}
            className={`size-14 rounded-full px-0 ${BONE_ON_HERO} ${PRESS_FEEL}`}
          >
            <MinusIcon size={28} />
          </Button>
        </HapticTap>

        {/* Announced rather than silent: the buttons say what they do, but
            what the number BECAME is the answer to the tap, and without
            this a screen reader would never hear it. The live region is
            the outer span and stays mounted; only the number inside is
            keyed, so each change replays the bump without the region
            itself being torn down and re-announced from scratch. */}
        <span
          aria-live="polite"
          className="text-display font-600 tracking-display tabular-nums"
        >
          <span key={minutes} className="inline-block motion-safe:animate-value-bump">
            {formatHours(minutes)}
          </span>
        </span>

        <HapticTap
          radius="full"
          isDisabled={!changes(HOURS_STEP_MINUTES)}
          onTap={() => add(HOURS_STEP_MINUTES)}
        >
          <Button
            variant="action"
            aria-label={t("increase", { minutes: HOURS_STEP_MINUTES })}
            isDisabled={!changes(HOURS_STEP_MINUTES)}
            onPress={() => add(HOURS_STEP_MINUTES)}
            className={`size-14 rounded-full px-0 ${PRESS_FEEL}`}
          >
            <PlusIcon size={28} />
          </Button>
        </HapticTap>
      </div>

      <div className="flex gap-2">
        {HOURS_QUICK_ADD_MINUTES.map((delta) => (
          <HapticTap
            key={delta}
            radius="sm"
            className="flex-1"
            isDisabled={!changes(delta)}
            onTap={() => add(delta)}
          >
            <Button
              variant="heroGhost"
              isDisabled={!changes(delta)}
              onPress={() => add(delta)}
              className={`h-10 w-full rounded-sm px-0 text-sm font-560 ${BONE_ON_HERO} ${PRESS_FEEL}`}
            >
              {t("quickAdd", { minutes: delta })}
            </Button>
          </HapticTap>
        ))}
      </div>
    </section>
  );
};
