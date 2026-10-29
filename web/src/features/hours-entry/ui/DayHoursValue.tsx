"use client";

import { formatHours } from "@/entities/ministry-day";

import { useDayHoursControls } from "../model/day-hours-context";

// The open day's hours, as a string and nothing else — no element, no
// class, no label. The strip on /day puts this inside its own chip (ADR
// 0065): the number belongs to this feature, the look belongs to the
// screen, and a component that brought markup with it would hand the
// screen a chip it cannot style.
//
// Why a component at all, and not a number passed down: it is the live
// one. The card saves optimistically, so what the person sees is their
// last tap, not what the server answered — and the chip for the same day
// has to say the same thing.
export const DayHoursValue = () => {
  const { minutes } = useDayHoursControls();

  return formatHours(minutes);
};
