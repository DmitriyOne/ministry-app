import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { parseMonthSlug } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { routes } from "@/shared/config";
import { CenteredState } from "@/shared/ui/centered-state";

import { readMonthPage } from "../api/read-month-page";
import { canStepForward } from "../model/month-span";
import { MonthDaysTable } from "./MonthDaysTable";
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

  return (
    <CenteredState fill className="justify-start gap-5 pt-7">
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
    </CenteredState>
  );
};
