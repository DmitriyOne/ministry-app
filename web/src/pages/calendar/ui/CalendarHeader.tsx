import { getTranslations } from "next-intl/server";

import {
  addMonths,
  calendarPath,
  type MonthKey,
  monthHeading,
} from "@/entities/ministry-status";
import { Button, LinkButton } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { InfoHint } from "@/shared/ui/info-hint";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icons";
import { Title } from "@/shared/ui/title";

import { canStepForward } from "../model/month-span";

type CalendarHeaderProps = {
  month: MonthKey;
  // The month this person is in. Null is "we do not know" — the zone did
  // not read — and it is not the same as any month: see the arrow below.
  currentMonth: MonthKey | null;
};

// The heading and the two steps beside it, the month screen's header
// pointed at the calendar's own addresses (ADR 0069): the month is in
// the address, so a step is a navigation and the browser's back gesture
// walks the months.
const ARROW = "size-11 shrink-0 rounded-full p-0 [--press-scale:0.94]";

export const CalendarHeader = async ({ month, currentMonth }: CalendarHeaderProps) => {
  const t = await getTranslations("screens.calendar");
  const hint = await getTranslations("screens.calendar.hints.grid");

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* The sign sits beside the eyebrow, not beside the arrows: in
            the arrow group it took width from the heading, and
            "November 2026" wrapped onto two lines (seen on the phone
            width). The eyebrow is short, so there is room there and
            nothing moves. */}
        <div className="flex items-center gap-0.5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <InfoHint text={hint("text")} label={hint("label")} className="-my-3" />
        </div>
        <Title>{monthHeading(month)}</Title>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* No floor going back: the database takes any past month, and
            somebody entering a year they served before this app existed
            is a person this screen is for. */}
        <LinkButton
          href={calendarPath(addMonths(month, -1))}
          variant="plain"
          aria-label={t("previousMonth")}
          className={ARROW}
        >
          <ChevronLeftIcon size={20} />
        </LinkButton>

        {/* On the current month forward is a button that is there and
            refuses, so the pair never moves — and it refuses when the
            current month is UNKNOWN too, because a guess from the
            default calendar runs ahead of anybody west of London and
            would offer a month this screen turns into a 404. */}
        {canStepForward(month, currentMonth)
          ? (
              <LinkButton
                href={calendarPath(addMonths(month, 1))}
                variant="plain"
                aria-label={t("nextMonth")}
                className={ARROW}
              >
                <ChevronRightIcon size={20} />
              </LinkButton>
            )
          : (
              <Button
                isDisabled
                variant="plain"
                aria-label={t("nextMonth")}
                className={ARROW}
              >
                <ChevronRightIcon size={20} />
              </Button>
            )}
      </div>
    </header>
  );
};
