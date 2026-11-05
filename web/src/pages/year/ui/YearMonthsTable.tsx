import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { formatHours, MINUTES_IN_HOUR } from "@/entities/ministry-day";
import { formatMonthName, monthPath } from "@/entities/ministry-status";
import { cn } from "@/shared/lib/cn";
import { LockClosedIcon } from "@/shared/ui/icons";

import { hasAnyHours, type YearMonthRow } from "../model/year-months";
import { YEAR_MONTH_ROW, YearMonthsShell } from "./YearMonthsShell";

type YearMonthsTableProps = {
  months: YearMonthRow[];
};

// The twelve months of the service year, a line each, with the year's
// running total beside every one.
//
// All twelve, unlike the month screen's table of days: a year has twelve
// months whoever recorded what, and the question this screen answers is
// "which of them am I short on" — which cannot be answered by a list
// that leaves the short ones out. A month with nothing recorded shows a
// DASH rather than 0:00, because a zero would say somebody opened it and
// found nothing there (ADR 0067, decision 8).
//
// Each line is a link to its month, and a plain next/link rather than
// LinkButton: the line is a three-column row, and buttonVariants is one
// line of fixed height — the reading the day strip's chips and the month
// screen's rows both made.
export const YearMonthsTable = async ({ months }: YearMonthsTableProps) => {
  const t = await getTranslations("screens.year.months");
  const columns = {
    month: t("columns.month"),
    hours: t("columns.hours"),
    total: t("columns.total"),
  };

  // Nothing recorded in the whole year says so in a sentence rather than
  // drawing twelve dashes, which would read as a fault rather than as an
  // empty year.
  if (!hasAnyHours(months)) {
    return (
      <YearMonthsShell title={t("title")} columns={columns}>
        <p className="py-5 text-caption font-500 text-pretty text-ink-muted">
          {t("empty")}
        </p>
      </YearMonthsShell>
    );
  }

  return (
    <YearMonthsShell title={t("title")} columns={columns}>
      <ul className="flex flex-col">
        {months.map((row, index) => {
          // Short of its own goal is --negative, met or over the
          // project's green, and a month with no goal is neither: there
          // is nothing it fell short of. The colour is never the only
          // carrier — the goal stands beside the name and the figure is
          // right there (ADR 0067, decision 4).
          const isShort = row.goalHours !== null
            && row.minutes !== null
            && row.minutes < row.goalHours * MINUTES_IN_HOUR;

          return (
            <li key={row.month}>
              <Link
                href={monthPath(row.month)}
                className={cn(
                  YEAR_MONTH_ROW,
                  "pressable py-3.5 active:bg-primary/10",
                  index === months.length - 1 ? null : "border-b border-ink-a09",
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5">
                  <span className="truncate text-list-row font-540 text-ink">
                    {formatMonthName(row.month)}
                  </span>
                  {row.goalHours === null
                    ? null
                    : (
                        <span className="shrink-0 text-caption font-500 text-ink-a55">
                          {t("goal", { hours: row.goalHours })}
                        </span>
                      )}
                  {/* A closed month, marked where the person can see it
                      without opening anything. Reopening lives on the
                      month itself: one place, not two to keep in step
                      (ADR 0067, decision 7). */}
                  {row.isClosed
                    ? (
                        <LockClosedIcon
                          size={13}
                          className="shrink-0 text-ink-a55"
                          aria-label={t("closed")}
                        />
                      )
                    : null}
                </span>

                <span
                  className={cn(
                    "text-right text-list-row font-540 tabular-nums",
                    row.minutes === null
                      ? "text-ink-a55"
                      : isShort ? "text-negative" : "text-primary",
                  )}
                >
                  {row.minutes === null ? t("none") : formatHours(row.minutes)}
                </span>

                <span className="text-right text-caption font-500 text-ink-a55 tabular-nums">
                  {formatHours(row.runningMinutes)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </YearMonthsShell>
  );
};
