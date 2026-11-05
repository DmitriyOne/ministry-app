import { getTranslations } from "next-intl/server";

import { formatMonthName, type MonthKey, monthPath } from "@/entities/ministry-status";
import { TextLink } from "@/shared/ui/text-link";

type DayClosedNoticeProps = {
  month: MonthKey;
};

// Why the card below does not answer: the month has been reported and
// shut (ADR 0066).
//
// It names the month and links to it, because reopening lives there. A
// second button here would be a second place to keep in step with the
// month screen, and the person who wants to change a reported month
// should see what they are reopening before they do.
//
// The month's NAME is formatted data and comes from the domain; the
// sentence around it is interface text and comes from the dictionary
// (ADR 0014).
export const DayClosedNotice = async ({ month }: DayClosedNoticeProps) => {
  const t = await getTranslations("screens.day.hours");

  return (
    <p className="rounded-xl bg-primary/10 px-4 py-3.5 text-caption font-500 text-pretty text-hero">
      {t("closedNotice", { month: formatMonthName(month) })}
      {" "}
      <TextLink href={monthPath(month)}>{t("closedNoticeLink")}</TextLink>
    </p>
  );
};
