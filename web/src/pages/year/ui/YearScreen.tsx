import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { parseYearSlug } from "@/entities/ministry-status";
import { getSessionClaims } from "@/entities/session";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { routes } from "@/shared/config";

import { readYearPage } from "../api/read-year-page";
import { isFutureYear } from "../model/year-span";
import { YearHeader } from "./YearHeader";
import { YearMonthsTable } from "./YearMonthsTable";
import { YearPace } from "./YearPace";
import { YearScreenFrame } from "./YearScreenFrame";
import { YearSummary } from "./YearSummary";

type YearScreenProps = {
  params: Promise<{ year: string }>;
};

// One service year: what it came to, and the twelve months it was made
// of.
//
// The year is in the address (ADR 0067), so this screen never works out
// which year it is about — which is what lets every read start at once
// and what makes the arrows ordinary navigation.
//
// Each block answers for itself. A summary that did not load is replaced
// by a failure card in its place; so is the table. There is no state in
// which the whole screen is unavailable, because the year has a name
// whatever the database says.
export const YearScreen = async ({ params }: YearScreenProps) => {
  const year = parseYearSlug((await params).year);

  // Garbage in the address is a 404 and not a redirect to this year: the
  // person followed a link to something that does not exist, and quietly
  // showing them something else would hide that.
  if (year === null) notFound();

  // proxy.ts already keeps this screen behind a session — except under
  // DEV_MODE, which switches the proxy off entirely (ADR 0063, decision
  // 12): without this the reads run as `anon` and the screen says "could
  // not load" at somebody who simply is not signed in.
  if (!await getSessionClaims()) redirect(routes.login);

  const page = await readYearPage(year);

  // A year that has not started yet. Checked after the read because the
  // answer depends on the person's calendar, which the read brings back;
  // when it is unknown nothing is refused — canStepForward already keeps
  // the arrow from offering the step.
  if (isFutureYear(year, page.currentYear)) notFound();

  const t = await getTranslations("screens.year");

  return (
    <YearScreenFrame>
      <YearHeader year={year} currentYear={page.currentYear} />

      {page.summary === null
        ? (
            <ScreenLoadFailure
              eyebrow={t("summary.label")}
              title={t("summaryFailure.title")}
              text={t("summaryFailure.text")}
            />
          )
        : <YearSummary summary={page.summary} />}

      {/* Whether the year is keeping up with its own calendar. Absent on
          any year but the one being lived and on any year without a
          goal; the figures it needs come from the summary, so a summary
          that did not load takes it with it. */}
      {page.summary === null
        ? null
        : (
            <YearPace
              today={page.today}
              servedMinutes={page.summary.totalMinutes}
              goalHours={page.summary.goalHours}
              months={page.months}
            />
          )}

      {page.months === null
        ? (
            <ScreenLoadFailure
              eyebrow={t("months.title")}
              title={t("monthsFailure.title")}
              text={t("monthsFailure.text")}
            />
          )
        : <YearMonthsTable months={page.months} />}
    </YearScreenFrame>
  );
};
