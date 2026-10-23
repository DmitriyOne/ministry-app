import { getTranslations } from "next-intl/server";

import type { EffectiveMinistryStatus } from "@/entities/ministry-status";
import { GoalCard } from "@/shared/ui/goal-card";

type MinistryGoalsProps = {
  // Null when the status could not be read; nothing is drawn then.
  status: EffectiveMinistryStatus | null;
  // Already summed by the database over the months this person is a
  // regular pioneer (ADR 0061). Null means that read failed.
  yearGoalHours: number | null;
};

// The two numbers the ministry status produces, directly under the
// person they belong to: the month, and the service year.
//
// A description list, not two divs: the pair is two terms and their
// values, so it reads as "Monthly goal, 30 hours" rather than four loose
// lines. GoalCard renders the dt/dd of one card.
export const MinistryGoals = async ({ status, yearGoalHours }: MinistryGoalsProps) => {
  const t = await getTranslations("screens.profile.goals");

  if (!status) return null;

  // A dash, not a zero: "no goal at all" is an answer a publisher may
  // give, and a goal of zero hours would be a different claim. The
  // year's total is zero in exactly the same case — no month of it
  // counted — so both read through here.
  const label = (hours: number | null) =>
    hours === null || hours === 0 ? t("noGoal") : t("hours", { hours });

  return (
    <dl className="grid grid-cols-2 gap-3">
      <GoalCard tone="primary" label={t("month")} value={label(status.monthlyGoalHours)} />
      {/* The year counts only the months this person is a regular
          pioneer, because that is the one status with a yearly norm (the
          owner's rule): a publisher works at their own pace, and an
          auxiliary pioneer commits a month at a time. So this card shows
          a dash for everybody else — and for a pioneer appointed in
          November it shows 500, the truth about their year, rather than
          the 600 from the leaflet. */}
      <GoalCard tone="deep" label={t("year")} value={label(yearGoalHours)} />
    </dl>
  );
};
