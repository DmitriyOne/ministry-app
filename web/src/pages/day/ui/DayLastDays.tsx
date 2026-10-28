import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { type DayKey, dayPath, formatHours, shortDayLabel } from "@/entities/ministry-day";
import { DayHoursValue } from "@/features/hours-entry";
import type { PreviousDay } from "../model/last-days";
import { progressAmount } from "../model/progress-text";
import { LAST_DAYS_CHIP, LastDaysShell } from "./LastDaysShell";

type DayLastDaysProps = {
  // The day the screen is on. Its chip is the seventh and last, on the
  // right, where the card above it and the forward arrow are.
  openDay: DayKey;
  days: PreviousDay[];
};

// The week behind the open day: seven chips, each a day — weekday, date,
// and the hours on it (ADR 0065, the owner's artboard B). Under the
// progress block, which is where macro A left room for it (ADR 0064).
//
// What it is for: the progress block says how the month is going, and
// this says which days are still empty. A gap here is the thing a person
// acts on — it reads as "go back and fill that in" — which is why a day
// with no row shows a dash and not 0:00: a zero would claim somebody
// looked and there was nothing (ADR 0062).
//
// Six of the chips are links and server-rendered. The seventh is the
// open day: not a link, because it is this page, and its number is NOT
// read from the database — DayHoursValue takes it from the hours
// provider, so the chip and the card never disagree after a tap (ADR
// 0065). That one number is the only client-rendered thing in here.
//
// In pages/day and not in a slice of its own, by the same reading as the
// heading beside it: FSD v2.1 keeps code where it is used until there is
// real reuse, and there is one caller. The calendar (a later step) is
// the legitimate reason to extract it — once it exists and says which
// shape it needs.
//
// Plain next/link rather than LinkButton: a chip is a column of three
// lines with no fixed height, and buttonVariants is a single row with
// one (`inline-flex items-center`, `h-*`, `px-*`, `rounded-button`,
// `bg-card`, `shadow-card`) — using it would mean overriding six
// properties to get back to this. `pressable` gives the press the rest
// of the app has, and next/link keeps the step client-side, which is
// what matters: a full load would re-run LaunchGate and its splash
// (ADR 0024).
const HEADING_ID = "day-last-days-heading";

// Only the six links press. The chip's outline, and why `pressable` is
// not part of it, are in LastDaysShell beside the card.
const CHIP_LINK = `${LAST_DAYS_CHIP} bg-background pressable`;

// A day with hours stands in full ink, a day without recedes: the strip
// is read for its gaps, and a faint chip is the one being offered.
// Whole class strings rather than a tone picked in the markup, because
// the dictionary linter reads a bare string in a ternary as text that
// should have been translated — and it is right to, so the strings stay
// out of the component.
const CHIP_RECORDED = `${CHIP_LINK} text-foreground`;
const CHIP_EMPTY = `${CHIP_LINK} text-ink-faint`;
const CHIP_OPEN = `${LAST_DAYS_CHIP} bg-hero text-hero-foreground`;
const WEEKDAY = "text-eyebrow font-600 tracking-eyebrow uppercase";
const DATE = "text-body font-600 tabular-nums";
const VALUE = "text-eyebrow font-540 tabular-nums";

export const DayLastDays = async ({ openDay, days }: DayLastDaysProps) => {
  const t = await getTranslations("screens.day.lastDays");
  // The hours in words ("2 h 15 min") for the accessible name, from the
  // same phrases and the same function the progress block's bracket uses
  // (../model/progress-text). The chip shows "2:15", which is right to
  // look at in a column 45px wide and wrong to hear.
  const tProgress = await getTranslations("screens.day.progress");
  const open = shortDayLabel(openDay);

  return (
    <LastDaysShell headingId={HEADING_ID} label={t("label")}>
      {days.map(({ day, minutes }) => {
        const { weekday, dayOfMonth } = shortDayLabel(day);

        return (
          <Link
            key={day}
            href={dayPath(day)}
            aria-label={minutes === null
              ? t("chipEmpty", { weekday, date: dayOfMonth })
              : t("chipHours", {
                  weekday,
                  date: dayOfMonth,
                  amount: progressAmount(tProgress, minutes),
                })}
            className={minutes === null ? CHIP_EMPTY : CHIP_RECORDED}
          >
            <span className={`${WEEKDAY} text-ink-faint`}>{weekday}</span>
            <span className={DATE}>{dayOfMonth}</span>
            <span className={VALUE}>
              {minutes === null ? t("none") : formatHours(minutes)}
            </span>
          </Link>
        );
      })}

      {/* The open day. A <div>, not a link to the page it is already on,
          and not a button: there is nothing to press. aria-current is
          what says which one it is, since colour cannot. */}
      <div aria-current="date" className={CHIP_OPEN}>
        <span className={`${WEEKDAY} text-white/50`}>{open.weekday}</span>
        <span className={DATE}>{open.dayOfMonth}</span>
        <span className={VALUE}>
          <DayHoursValue />
        </span>
      </div>
    </LastDaysShell>
  );
};
