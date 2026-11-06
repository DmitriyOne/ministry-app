import type { ReactNode } from "react";

import { cn } from "@/shared/lib/cn";

type YearMonthsShellProps = {
  title: string;
  columns: { month: string; hours: string; total: string };
  children: ReactNode;
};

// The card, the heading and the column strip, shared by the table and
// its skeleton — the arrangement MonthDaysShell and LastDaysShell have,
// and for the same reason: a loading state that drifts from the real
// block is a jump at the moment the data lands.
//
// The month column is wider than the day's: "September · 50 h" needs the
// room that "1 Sun" did not.
export const YEAR_MONTH_ROW = "grid grid-cols-[1fr_76px_76px] items-baseline gap-2";

export const YearMonthsShell = ({ title, columns, children }: YearMonthsShellProps) => (
  <section className="flex flex-col gap-3">
    <h2 className="text-eyebrow font-620 tracking-eyebrow uppercase text-ink-a55">
      {title}
    </h2>

    <div className="rounded-2xl bg-card px-5 shadow-card">
      <div className={cn(YEAR_MONTH_ROW, "border-b border-ink-a09 py-3")}>
        <span className="text-eyebrow font-620 tracking-eyebrow uppercase text-ink-a55">
          {columns.month}
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
