"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import {
  type DayKey,
  dayPath,
  durationPhrase,
  formatHours,
  shortDayLabel,
} from "@/entities/ministry-day";
import { DayHoursValue } from "@/features/hours-entry";

import { readOlderDays } from "../api/read-older-days-action";
import { isFutureDay, type StripDay, visibleDays } from "../model/last-days";
import { LAST_DAYS_CHIP, LAST_DAYS_ROW, LastDaysShell } from "./LastDaysShell";

type DayLastDaysProps = {
  // The day the screen is on. Its chip is the dark one, wherever the
  // strip happens to be standing.
  openDay: DayKey;
  // The person's own today, or null when the zone read failed. It is
  // what divides a day that can be opened from one that cannot — and
  // with it unknown, the strip stops at the open day rather than guess
  // (visibleDays, ../model/last-days).
  today: DayKey | null;
  days: StripDay[];
};

// The strip of days under the progress block, which scrolls (ADR 0065,
// the owner's artboard B; update 2026-11-09 for the scrolling).
//
// What it is for: the progress block says how the month is going, and
// this says which days are still empty. A gap here is the thing a
// person acts on — it reads as "go back and fill that in" — which is
// why a day with no row shows a dash and not 0:00: a zero would claim
// somebody looked and there was nothing (ADR 0062).
//
// It held exactly seven days until this update, and seven is what it
// still shows at rest: the open day on the right and the week behind
// it. Now it also pulls, back without a limit and forward to the end of
// the open day's month, which is where the days nobody has lived yet
// sit — drawn, so the month can be seen whole, but on no plate and
// behind no link.
//
// A CLIENT component, which it was not before. The reason is the pull
// itself: scrolling has to be noticed, the next chunk fetched and the
// position held while the chips are pushed in from the left. The open
// day's number was already client-rendered for its own reason
// (DayHoursValue, below), so the server markup this replaces was never
// the whole strip anyway.
//
// In pages/day and not in a slice of its own, by the same reading as
// before: FSD v2.1 keeps code where it is used until there is real
// reuse, and there is one caller.
const HEADING_ID = "day-last-days-heading";

// How close to the left edge the strip gets before the next chunk is
// asked for — about four chips, so the days are usually there by the
// time the finger reaches them.
const LOAD_AHEAD_PX = 180;

// Layout work that must happen before the browser paints, from a
// component React also renders on the server. useLayoutEffect does
// nothing there and says so in the console every time, so the server
// gets the effect that is correct for it: one that never runs, because
// there is no scrolling to do without a DOM.
const useBrowserLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

// Only the links press. The chip's outline, and why `pressable` is not
// part of it, are in LastDaysShell beside the card.
//
// Under the finger a chip also takes COLOUR (the owner, 2026-10-28):
// `pressable` alone is a 2% squeeze, which answers a thumb but does not
// read as "this one". The tint is the app's own green, and it is the
// first half of a sentence the arrival finishes — the day it opens on
// becomes the dark chip.
//
// Pure CSS, so it costs no JavaScript and happens on touch rather than
// after a round trip: the same `:active` the whole app presses on. No
// `transition-colors` with it — `.pressable` lives in @layer components
// and a transition utility sits above that layer, so adding one would
// replace `transition: transform` and take the squeeze away.
//
// The TEXT goes full ink with it, and that is not decoration: measured,
// --ink-faint on the tinted ground is 4.05:1, which fails AA for an
// 11px label — the same trap written down for mint on --primary in
// GoalCard (ADR 0012). Ink on that ground is 9.58:1. So the whole chip
// steps forward together, and the faint weekday needs the group to hear
// it: a colour set on the parent does not reach a child that names its
// own.
const CHIP_LINK
  = `group/chip ${LAST_DAYS_CHIP} snap-end bg-background pressable active:bg-primary/20 active:text-foreground`;

// A day with hours stands in full ink, a day without recedes: the strip
// is read for its gaps, and a faint chip is the one being offered.
// Whole class strings rather than a tone picked in the markup, because
// the dictionary linter reads a bare string in a ternary as text that
// should have been translated — and it is right to, so the strings stay
// out of the component.
const CHIP_RECORDED = `${CHIP_LINK} text-foreground`;
const CHIP_EMPTY = `${CHIP_LINK} text-ink-faint`;
const CHIP_OPEN = `${LAST_DAYS_CHIP} snap-end bg-hero text-hero-foreground`;

// A day still to come: no plate at all, which is the owner's pick of
// the two that were drawn (2026-11-09). The plate is what the other
// chips sit on, so its absence says "nothing to press" before the
// finger arrives, rather than after.
//
// --ink-a55 on the card is 3.5:1 — below AA for this size, and
// deliberately so: WCAG 1.4.3 exempts text that is part of an inactive
// component, and a future day is as inactive as it gets. It is dimmer
// than an empty day behind us (--ink-faint, 4.77:1 here) on purpose:
// those two dashes mean different things, and only one of them is an
// invitation.
const CHIP_FUTURE = `${LAST_DAYS_CHIP} text-ink-a55`;

const WEEKDAY = "text-eyebrow font-600 tracking-eyebrow uppercase";
const WEEKDAY_QUIET = `${WEEKDAY} text-ink-faint group-active/chip:text-foreground`;
const DATE = "text-body font-600 tabular-nums";
const VALUE = "text-eyebrow font-540 tabular-nums";

// Where the open day sat on screen when it was tapped, so the next
// screen can put it back there. Session storage, not local: it is one
// gesture's worth of state and has no business outliving the tab.
const OFFSET_KEY = "ministry.last-days-offset";

// Both halves swallow their own failure. Storage throws in a private
// window and in a browser told to block site data, and the strip has an
// answer for that which costs nothing: it opens where it always opens,
// with the open day on the right.
const rememberOffset = (offset: number) => {
  try {
    sessionStorage.setItem(OFFSET_KEY, String(offset));
  } catch {
    // Nothing to do and nothing worth reporting: a strip that starts at
    // its own right edge is the behaviour everybody had until today.
  }
};

// Read once and cleared, because it describes one arrival. Left behind,
// it would reposition the strip on a visit the person made some other
// way — through the menu, or the arrows in the heading — where "put it
// back where it was" is not what they asked for.
const takeOffset = (): number | null => {
  try {
    const stored = sessionStorage.getItem(OFFSET_KEY);

    sessionStorage.removeItem(OFFSET_KEY);

    if (stored === null) return null;

    const offset = Number(stored);

    return Number.isFinite(offset) ? offset : null;
  } catch {
    return null;
  }
};

export const DayLastDays = ({ openDay, today, days: initialDays }: DayLastDaysProps) => {
  const t = useTranslations("screens.day.lastDays");
  // The hours in words ("2 h 15 min") for the accessible name, from the
  // same phrases and the same function the progress block's bracket
  // uses (../model/progress-text). The chip shows "2:15", which is
  // right to look at in a column 42px wide and wrong to hear.
  const tProgress = useTranslations("screens.day.progress");

  const [days, setDays] = useState(initialDays);

  const stripRef = useRef<HTMLDivElement | null>(null);
  // One request at a time, and no more requests at all once one came
  // back empty-handed. Refs rather than state: nothing on screen
  // depends on either, and a re-render per scroll event is exactly what
  // a scroll handler must not cause.
  const isLoading = useRef(false);
  const hasFailed = useRef(false);
  // The strip's width before chips were pushed in on the left, so the
  // scroll can be moved by exactly as much as the content grew. Measured
  // rather than counted in chip widths: the arithmetic would be a second
  // copy of the CSS.
  const widthBefore = useRef<number | null>(null);

  // Where the strip stands when it first appears. A ref callback rather
  // than an effect, because this runs with the DOM attached and before
  // the browser paints — an effect would show the strip at its oldest
  // day for a frame and then jump.
  const attachStrip = useCallback((strip: HTMLDivElement | null) => {
    stripRef.current = strip;

    if (!strip) return;

    const open = strip.querySelector<HTMLElement>("[data-open-day]");

    if (!open) return;

    const offset = takeOffset();

    // Arrived by tapping a chip: that day goes back exactly where the
    // finger left it, so the strip appears not to have moved and only
    // the colour changes. Arrived any other way: the open day on the
    // right, which is where this strip has always ended.
    strip.scrollLeft = offset === null
      ? open.offsetLeft + open.offsetWidth - strip.clientWidth
      : open.offsetLeft - offset;
  }, []);

  // After older days are pushed in on the left, the chips under the
  // finger have all moved right by the width of what arrived. Putting
  // the scroll back by the same amount is what makes the strip feel
  // continuous instead of snapping backwards.
  useBrowserLayoutEffect(() => {
    const strip = stripRef.current;
    const before = widthBefore.current;

    if (!strip || before === null) return;

    widthBefore.current = null;
    strip.scrollLeft += strip.scrollWidth - before;
  }, [days]);

  const loadOlder = useCallback(async () => {
    const strip = stripRef.current;
    const oldest = days[0]?.day;

    if (!strip || !oldest || isLoading.current || hasFailed.current) return;

    isLoading.current = true;
    widthBefore.current = strip.scrollWidth;

    const older = await readOlderDays(oldest);

    isLoading.current = false;

    // Null is a read that failed or a session that has gone; either way
    // asking again on the next scroll event would be asking forty times
    // a second. The strip keeps what it has and stops growing — there
    // is nothing to say to the person, because nothing they can see has
    // gone wrong.
    if (older === null || older.length === 0) {
      hasFailed.current = true;
      widthBefore.current = null;

      return;
    }

    setDays((current) => [...older, ...current]);
  }, [days]);

  const onScroll = useCallback(() => {
    const strip = stripRef.current;

    if (strip && strip.scrollLeft < LOAD_AHEAD_PX) void loadOlder();
  }, [loadOlder]);

  // Remembered on the way out, from the chip that was tapped: its
  // distance from the strip's left edge is all the next screen needs to
  // put it back.
  const rememberTapped = useCallback((chip: HTMLElement | null) => {
    const strip = stripRef.current;

    if (strip && chip) {
      rememberOffset(chip.getBoundingClientRect().left - strip.getBoundingClientRect().left);
    }
  }, []);

  return (
    <LastDaysShell headingId={HEADING_ID} label={t("label")}>
      <div
        ref={attachStrip}
        onScroll={onScroll}
        // `overscroll-x-contain` is not decoration: without it a flick
        // that runs past the oldest chip is handed to Safari, which
        // reads a horizontal drag from the edge as "go back".
        className={`${LAST_DAYS_ROW} snap-x snap-proximity overflow-x-auto overscroll-x-contain hide-scrollbar`}
      >
        {visibleDays(days, openDay, today).map(({ day, minutes }) => {
          const { weekday, dayOfMonth } = shortDayLabel(day);

          // The open day. A <div>, not a link to the page it is already
          // on, and not a button: there is nothing to press. aria-current
          // is what says which one it is, since colour cannot. Its number
          // is NOT read from the database — DayHoursValue takes it from
          // the hours provider, so the chip and the card never disagree
          // after a tap (ADR 0065).
          if (day === openDay) {
            return (
              <div key={day} data-open-day aria-current="date" className={CHIP_OPEN}>
                <span className={`${WEEKDAY} text-white/50`}>{weekday}</span>
                <span className={DATE}>{dayOfMonth}</span>
                <span className={VALUE}>
                  <DayHoursValue />
                </span>
              </div>
            );
          }

          // A day nobody has lived yet. Not a link, so it is not in the
          // tab order either, and no accessible name of its own: the
          // weekday and the date are read out as the text they are, and
          // there is nothing here to announce as an action.
          if (isFutureDay(day, today)) {
            return (
              <div key={day} className={CHIP_FUTURE}>
                <span className={WEEKDAY}>{weekday}</span>
                <span className={DATE}>{dayOfMonth}</span>
                <span className={VALUE}>{t("none")}</span>
              </div>
            );
          }

          return (
            <Link
              key={day}
              href={dayPath(day)}
              // Off, unlike everywhere else in the app, and this is the
              // one place it has to be: next/link prefetches a link when
              // it scrolls into view, and a strip pulled back through a
              // month would ask the server for thirty screens nobody
              // opened. Tapping still navigates client-side, and the
              // loading boundary (day/[day]/loading.tsx) covers the
              // moment the prefetch used to.
              prefetch={false}
              onClick={(event) => rememberTapped(event.currentTarget)}
              aria-label={minutes === null
                ? t("chipEmpty", { weekday, date: dayOfMonth })
                : t("chipHours", {
                    weekday,
                    date: dayOfMonth,
                    amount: durationPhrase(tProgress, minutes),
                  })}
              className={minutes === null ? CHIP_EMPTY : CHIP_RECORDED}
            >
              <span className={WEEKDAY_QUIET}>{weekday}</span>
              <span className={DATE}>{dayOfMonth}</span>
              <span className={VALUE}>
                {minutes === null ? t("none") : formatHours(minutes)}
              </span>
            </Link>
          );
        })}
      </div>
    </LastDaysShell>
  );
};
