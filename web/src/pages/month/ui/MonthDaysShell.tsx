import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type MonthDaysShellProps = {
  title: string;
  // Passed in rather than built here: the shell is markup, and the words
  // belong to the screen. The skeleton passes nothing, because there is
  // nothing to explain about a block that has not arrived.
  hint?: ReactNode;
  columns: { day: string; hours: string; total: string };
  children: ReactNode;
};

// The card, the heading and the column strip, shared by the table and
// its skeleton — the arrangement LastDaysShell has on the day screen,
// and for the same reason: a loading state that drifts from the real
// block is a jump at the moment the data lands.
export const MONTH_DAY_ROW = "grid grid-cols-[1fr_84px_84px] items-baseline gap-2";

export const MonthDaysShell = ({
  title,
  columns,
  hint,
  children,
}: MonthDaysShellProps) => (
  <section className="flex flex-col gap-3">
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-eyebrow font-620 tracking-eyebrow uppercase text-ink-a55">
        {title}
      </h2>
      {hint}
    </div>

    <div className="rounded-2xl bg-card px-5 shadow-card">
      <div className={cn(MONTH_DAY_ROW, "border-b border-ink-a09 py-3")}>
        <span className="text-eyebrow font-620 tracking-eyebrow uppercase text-ink-a55">
          {columns.day}
        </span>
        <span className="text-right text-eyebrow font-620 tracking-eyebrow uppercase text-ink-a55">
          {columns.hours}
        </span>
        <span className="text-right text-eyebrow font-620 tracking-eyebrow uppercase text-ink-a55">
          {columns.total}
        </span>
      </div>

      {children}
    </div>
  </section>
);
