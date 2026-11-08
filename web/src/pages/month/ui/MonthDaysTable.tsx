import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { dayPath, formatHours, shortDayLabel } from "@/entities/ministry-day";
import { cn } from "@/shared/lib/cn";
import { InfoHint } from "@/shared/ui/info-hint";

import type { MonthDayRow } from "../model/month-days";
import { MONTH_DAY_ROW, MonthDaysShell } from "./MonthDaysShell";

type MonthDaysTableProps = {
  days: MonthDayRow[];
};

// What was recorded in this month, a line each, with the month's running
// total beside every day.
//
// Only days that have a row. A month drawn as thirty mostly empty lines
// is a calendar, and the calendar is its own screen; this one answers
// "what did I put down". A recorded zero keeps its line, because
// somebody looked and there was nothing — a different fact from a day
// nobody opened (ADR 0062).
//
// Each line is a link to its day, and a plain next/link rather than
// LinkButton: the line is a three-column row, and buttonVariants is one
// line of fixed height (the same reading the day strip's chips made,
// ADR 0065).
export const MonthDaysTable = async ({ days }: MonthDaysTableProps) => {
  const t = await getTranslations("screens.month.days");
  const hint = await getTranslations("screens.month.hints.days");
  const sign = <InfoHint text={hint("text")} label={hint("label")} className="-mr-2" />;
  const columns = {
    day: t("columns.day"),
    hours: t("columns.hours"),
    total: t("columns.total"),
  };

  if (days.length === 0) {
    return (
      <MonthDaysShell title={t("title")} columns={columns} hint={sign}>
        <p className="py-5 text-caption font-500 text-pretty text-ink-muted">
          {t("empty")}
        </p>
      </MonthDaysShell>
    );
  }

  return (
    <MonthDaysShell title={t("title")} columns={columns} hint={sign}>
      <ul className="flex flex-col">
        {days.map((row, index) => {
          const label = shortDayLabel(row.day);

          return (
            <li key={row.day}>
              <Link
                href={dayPath(row.day)}
                className={cn(
                  MONTH_DAY_ROW,
                  "pressable py-3.5 active:bg-primary/10",
                  index === days.length - 1 ? null : "border-b border-ink-a09",
                )}
              >
                <span className="text-list-row font-540 text-ink">
                  {label.dayOfMonth}
                  {" "}
                  <span className="text-caption font-500 text-ink-a55">{label.weekday}</span>
                </span>
                <span className="text-right text-list-row font-540 text-primary tabular-nums">
                  {formatHours(row.minutes)}
                </span>
                <span className="text-right text-caption font-500 text-ink-a55 tabular-nums">
                  {formatHours(row.runningMinutes)}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </MonthDaysShell>
  );
};
