"use client";

import { createContext, type ReactNode, use } from "react";

import type { DayKey } from "@/entities/ministry-day";

import { type DayHoursControls, useDayHours } from "./use-day-hours";

// The day's hours, held once for everybody who shows them.
//
// There are two such places on /day now: the card, where the number is
// dialled, and the chip for the open day in the last-days strip (ADR
// 0065). Before this, the state lived inside the card — which was right
// while the card was its only reader, and wrong the moment a second one
// appeared: the strip would have drawn what the database answered when
// the screen was rendered, so one tap left two numbers for the same day
// on the same screen, disagreeing until something re-rendered.
//
// So the state moves up, and this is the only module that knows how it
// is kept: the readers below see minutes and the three things a tap
// needs, and nothing about timers, retries or rollback.
//
// What does NOT move up is the screen: the provider takes server-
// rendered children and passes them through, so the progress block and
// six of the seven chips stay server markup. The client islands on /day
// are the card and the open day's number — nothing else.
const DayHoursContext = createContext<DayHoursControls | null>(null);

type DayHoursProviderProps = {
  // Which day is being dialled, from the address (ADR 0063). Put the
  // React key on this provider, not on the card: a different day has to
  // be a different mount, and the state is here now.
  day: DayKey;
  // What the database held when the screen was rendered. Read once, at
  // mount; from then on the taps are the truth about the number.
  savedMinutes: number;
  // The month is closed, so the card is read-only (ADR 0066). Passed
  // down with the rest of the state rather than read here: the screen
  // has already asked the database, and a second reader would be a
  // second answer.
  isReadOnly: boolean;
  children: ReactNode;
};

export const DayHoursProvider = ({
  day,
  savedMinutes,
  isReadOnly,
  children,
}: DayHoursProviderProps) => {
  const controls = useDayHours({ day, savedMinutes, isReadOnly });

  return <DayHoursContext value={controls}>{children}</DayHoursContext>;
};

// Throws rather than falling back to zero, deliberately: a card that
// opened at zero outside the provider would let one tap overwrite hours
// somebody really served, which is the same reason an unavailable read
// draws no card at all (ADR 0062).
export const useDayHoursControls = (): DayHoursControls => {
  const controls = use(DayHoursContext);

  if (!controls) throw new Error("useDayHoursControls needs a DayHoursProvider above it.");

  return controls;
};
