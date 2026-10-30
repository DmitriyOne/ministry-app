import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { formatHours } from "@/entities/ministry-day";
import { monthHeading, parseMonthSlug } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { CloseMonthButton } from "@/features/close-month";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { routes } from "@/shared/config";

import { readMonthPage } from "../api/read-month-page";
import { formatClosedOn } from "../model/closed-on";
import { monthClosingState } from "../model/month-closing";
import { canStepForward } from "../model/month-span";
import { MonthDaysTable } from "./MonthDaysTable";
import { MonthScreenFrame } from "./MonthScreenFrame";
import { MonthHeader } from "./MonthHeader";
import { MonthSummary } from "./MonthSummary";

type MonthScreenProps = {
  params: Promise<{ month: string }>;
};

// One month: what it came to, and the days it was made of.
//
// The month is in the address (ADR 0066), so this screen never works out
// which month it is about — which is what lets every read start at once
// and what makes the arrows ordinary navigation.
//
// Each block answers for itself. A summary that did not load is replaced
// by a failure card in its place; so is the table. There is no state in
// which the whole screen is unavailable, because the month has a name
// whatever the database says.
export const MonthScreen = async ({ params }: MonthScreenProps) => {
  const month = parseMonthSlug((await params).month);

  // Garbage in the address is a 404 and not a redirect to this month:
  // the person followed a link to something that does not exist, and
  // quietly showing them something else would hide that.
  if (!month) notFound();

  // proxy.ts already keeps this screen behind a session — except under
  // DEV_MODE, which switches the proxy off entirely (ADR 0063, decision
  // 12): without this the reads run as `anon` and the screen says "could
  // not load" at somebody who simply is not signed in.
  if (!await getSessionClaims()) redirect(routes.login);

  const page = await readMonthPage(month);

  // A month that has not started yet. Checked after the read because the
  // answer depends on the person's calendar, which the read brings back;
  // when it is unknown, nothing is refused — `canStepForward` already
  // keeps the arrow from offering the step.
  if (page.currentMonth !== null && canStepForward(page.currentMonth, month)) notFound();

  const t = await getTranslations("screens.month");
  const closing = monthClosingState({
    month,
    currentMonth: page.currentMonth,
    isClosed: page.closedAt !== null,
  });
  // The day it was closed, when we have it. Null here is not a failure:
  // a month closed by a build before this column was read has no date to
  // name, and the notice says the shorter sentence instead.
  const closedOn = page.closedAt === null
    ? null
    : formatClosedOn(page.closedAt, page.timeZone);

  return (
    <MonthScreenFrame>
      <MonthHeader month={month} currentMonth={page.currentMonth} />

      {page.summary === null
        ? (
            <ScreenLoadFailure
              eyebrow={t("summary.label")}
              title={t("summaryFailure.title")}
              text={t("summaryFailure.text")}
            />
          )
        : <MonthSummary summary={page.summary} />}

      {page.days === null
        ? (
            <ScreenLoadFailure
              eyebrow={t("days.title")}
              title={t("daysFailure.title")}
              text={t("daysFailure.text")}
            />
          )
        : <MonthDaysTable days={page.days} />}

      {/* Nothing at all while the month is being lived: the button
          appears after midnight of the following month (the owner,
          2026-10-29), and a disabled one would raise the question of
          what it takes to enable it. */}
      {closing === "hidden"
        ? null
        : (
            <div className="mt-1 flex flex-col gap-3">
              {closing === "closed"
                ? (
                    <p className="rounded-xl bg-primary/10 px-4 py-3.5 text-caption font-500 text-pretty text-hero">
                      {closedOn === null
                        ? t("closing.closed")
                        : t("closing.closedOn", { date: closedOn })}
                    </p>
                  )
                : null}

              <CloseMonthButton
                month={month}
                state={closing}
                labels={{
                  close: t("closing.close"),
                  reopen: t("closing.reopen"),
                  // The month by name, not "this month": the dialog is
                  // the last thing between a tap and a month that stops
                  // being editable, and it should say which one.
                  confirmTitle: t("closing.confirmTitle", { month: monthHeading(month) }),
                  confirmBody: t("closing.confirmBody"),
                  confirmHoursLabel: t("closing.hoursLabel"),
                  // The figure the dialog is about. Dashes when the
                  // summary did not load — the month still closes, and
                  // the number is there to recognise it by, not to
                  // decide by.
                  hours: page.summary === null
                    ? t("closing.noHours")
                    : formatHours(page.summary.totalMinutes),
                  cancel: t("closing.cancel"),
                  refused: t("closing.refused"),
                  failed: t("closing.failed"),
                }}
              />
            </div>
          )}
    </MonthScreenFrame>
  );
};
