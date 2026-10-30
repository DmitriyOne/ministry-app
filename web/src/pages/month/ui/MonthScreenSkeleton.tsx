import { getTranslations } from "next-intl/server";

import { Skeleton } from "@/shared/ui/skeleton";

import { cn } from "@/shared/lib/cn";

import { MONTH_DAY_ROW, MonthDaysShell } from "./MonthDaysShell";
import { MonthScreenFrame } from "./MonthScreenFrame";

// The month while the database is still answering (ADR 0059). Only what
// the database has to answer gets a plate: the eyebrow, the column
// headings and the table's title are dictionary text, depend on nobody,
// and are drawn for real so they do not move when the figures land.
//
// The heading is a plate even though the month is in the address: this
// file is the loading boundary's, and a boundary does not see the route
// segment — drawing "Month" here and the real month a moment later would
// be a jump on every step between months (the same reading
// DayScreenSkeleton makes).
//
// Four rows, not thirty: the table is as long as the month was busy, and
// a skeleton that promised thirty lines would collapse to three.
const ROWS = 4;

export const MonthScreenSkeleton = async () => {
  const t = await getTranslations("screens.month");

  return (
    <MonthScreenFrame>
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <Skeleton className="h-2.5 w-14 rounded-xs" />
          <Skeleton className="h-7 w-40 rounded-sm" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="size-11 rounded-full" />
          <Skeleton className="size-11 rounded-full" />
        </div>
      </header>

      <div className="flex flex-col gap-4 rounded-2xl bg-hero px-5 py-6">
        <Skeleton className="h-2.5 w-28 rounded-xs bg-hero-foreground/15" />
        <Skeleton className="h-9 w-32 rounded-sm bg-hero-foreground/15" />
        <Skeleton className="h-1.5 w-full rounded-full bg-hero-foreground/15" />
      </div>

      <MonthDaysShell
        title={t("days.title")}
        columns={{
          day: t("days.columns.day"),
          hours: t("days.columns.hours"),
          total: t("days.columns.total"),
        }}
      >
        <div className="flex flex-col">
          {Array.from({ length: ROWS }, (_, index) => (
            <div
              key={index}
              className={cn(
                MONTH_DAY_ROW,
                "py-4",
                index === ROWS - 1 ? null : "border-b border-ink-a09",
              )}
            >
              <Skeleton className="h-3.5 w-16 rounded-xs" />
              <Skeleton className="h-3.5 w-12 justify-self-end rounded-xs" />
              <Skeleton className="h-3.5 w-12 justify-self-end rounded-xs" />
            </div>
          ))}
        </div>
      </MonthDaysShell>
    </MonthScreenFrame>
  );
};
