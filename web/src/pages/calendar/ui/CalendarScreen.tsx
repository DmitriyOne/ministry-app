import { notFound, redirect } from "next/navigation";

import { parseMonthSlug } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { routes } from "@/shared/config";
import { getTranslations } from "next-intl/server";

import { readCalendarPage } from "../api/read-calendar-page";
import { initialSelectedDay } from "../model/calendar-grid";
import { isFutureMonth } from "../model/month-span";
import { CalendarHeader } from "./CalendarHeader";
import { CalendarMonth } from "./CalendarMonth";
import { CalendarScreenFrame } from "./CalendarScreenFrame";

type CalendarScreenProps = {
  params: Promise<{ month: string }>;
};

// One month as a calendar: which days had ministry in them, and what was
// in the day you pick.
//
// The month is in the address (ADR 0069), so this screen never works out
// which month it is about — that is what makes the arrows ordinary
// navigation and lets both reads start at once.
//
// Unlike the month and year screens there is no block-by-block failure
// here: the grid IS the screen, and a grid drawn without its rows would
// say "nothing recorded" thirty times about a month nobody managed to
// read. So the days failing replaces the whole thing with one notice.
export const CalendarScreen = async ({ params }: CalendarScreenProps) => {
  const month = parseMonthSlug((await params).month);

  // Garbage in the address is a 404 and not a redirect to this month:
  // the person followed a link to something that does not exist, and
  // quietly showing them something else would hide that.
  if (month === null) notFound();

  // proxy.ts already keeps this screen behind a session — except under
  // DEV_MODE, which switches the proxy off entirely (ADR 0063, decision
  // 12).
  if (!await getSessionClaims()) redirect(routes.login);

  const page = await readCalendarPage(month);

  // A month that has not started yet (ADR 0069, decision 2). Checked
  // after the read because the answer depends on the person's calendar,
  // which the read brings back; when it is unknown nothing is refused —
  // canStepForward already keeps the arrow from offering the step.
  if (isFutureMonth(month, page.currentMonth)) notFound();

  const t = await getTranslations("screens.calendar");

  return (
    <CalendarScreenFrame>
      <CalendarHeader month={month} currentMonth={page.currentMonth} />

      {page.weeks === null
        ? (
            <ScreenLoadFailure
              eyebrow={t("eyebrow")}
              title={t("gridFailure.title")}
              text={t("gridFailure.text")}
            />
          )
        : (
            <CalendarMonth
              weeks={page.weeks}
              today={page.today}
              initialSelected={initialSelectedDay(month, page.today)}
            />
          )}
    </CalendarScreenFrame>
  );
};
