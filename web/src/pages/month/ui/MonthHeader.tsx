import { getTranslations } from "next-intl/server";

import { addMonths, type MonthKey, monthHeading, monthPath } from "@/entities/ministry-status";
import { Button, LinkButton } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icons";
import { Title } from "@/shared/ui/title";

import { canStepForward } from "../model/month-span";

type MonthHeaderProps = {
  month: MonthKey;
  // The month this person is in. Null is "we do not know" — the zone did
  // not read — and it is not the same as any month: see the arrow below.
  currentMonth: MonthKey | null;
};

// The heading and the two steps beside it, built like the day's and for
// the same reasons (ADR 0063): the address carries the month, so a step
// is a navigation, the browser's own back gesture walks the months, and
// LinkButton keeps it client-side with the neighbour prefetched.
const ARROW = "size-11 shrink-0 rounded-full p-0 [--press-scale:0.94]";

export const MonthHeader = async ({ month, currentMonth }: MonthHeaderProps) => {
  const t = await getTranslations("screens.month");

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        {/* The month with its year, always: a screen paged through years
            that said only "June" would be a question. */}
        <Title>{monthHeading(month)}</Title>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* No floor going back: the database takes any past month, and
            somebody entering a year they served before this app existed
            is a person this screen is for. */}
        <LinkButton
          href={monthPath(addMonths(month, -1))}
          variant="plain"
          aria-label={t("previousMonth")}
          className={ARROW}
        >
          <ChevronLeftIcon size={20} />
        </LinkButton>

        {/* On the current month forward is a button that is there and
            refuses, so the pair never moves. It refuses when the current
            month is UNKNOWN too, and that is the same reading the day
            screen's arrow makes: a guess from the default calendar runs
            ahead of anybody west of London, and the arrow would offer a
            month the screen turns into a 404 the moment the read
            recovers. */}
        {canStepForward(month, currentMonth)
          ? (
              <LinkButton
                href={monthPath(addMonths(month, 1))}
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
