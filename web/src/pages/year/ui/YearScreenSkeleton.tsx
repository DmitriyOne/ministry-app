import { getTranslations } from "next-intl/server";

import { cn } from "@/shared/lib/cn";
import { Skeleton } from "@/shared/ui/skeleton";

import { YEAR_MONTH_ROW, YearMonthsShell } from "./YearMonthsShell";
import { YearScreenFrame } from "./YearScreenFrame";

// The year while the database is still answering (ADR 0059). Only what
// the database has to answer gets a plate: the eyebrow, the column
// headings and the table's title are dictionary text, depend on nobody,
// and are drawn for real so they do not move when the figures land.
//
// The heading is a plate even though the year is in the address: this
// file is the loading boundary's, and a boundary does not see the route
// segment — drawing "Service year" here and "2026 / 2027" a moment
// later would be a jump on every step between years.
//
// TWELVE rows, unlike the month skeleton's four: a year's table always
// has twelve lines, so promising twelve is the truth rather than a
// guess at how busy the year was.
const ROWS = 12;

export const YearScreenSkeleton = async () => {
  const t = await getTranslations("screens.year");

  return (
    <YearScreenFrame>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Skeleton className="h-2.5 w-20 rounded-xs" />
          <Skeleton className="h-7 w-36 rounded-sm" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl bg-hero px-5 py-6">
        <Skeleton className="h-2.5 w-32 rounded-xs bg-hero-foreground/15" />
        <Skeleton className="h-9 w-32 rounded-sm bg-hero-foreground/15" />
        <Skeleton className="h-1.5 w-full rounded-full bg-hero-foreground/15" />
      </div>

      <YearMonthsShell
        title={t("months.title")}
        columns={{
          month: t("months.columns.month"),
          hours: t("months.columns.hours"),
          total: t("months.columns.total"),
        }}
      >
        <div className="flex flex-col">
          {Array.from({ length: ROWS }, (_, index) => (
            <div
              key={index}
              className={cn(
                YEAR_MONTH_ROW,
                "py-4",
                index === ROWS - 1 ? null : "border-b border-ink-a09",
              )}
            >
              <Skeleton className="h-3.5 w-24 rounded-xs" />
              <Skeleton className="h-3.5 w-12 justify-self-end rounded-xs" />
              <Skeleton className="h-3.5 w-12 justify-self-end rounded-xs" />
            </div>
          ))}
        </div>
      </YearMonthsShell>
    </YearScreenFrame>
  );
};
