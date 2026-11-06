import { getTranslations } from "next-intl/server";

import { type ServiceYear, yearHeading, yearPath } from "@/entities/ministry-status";
import { Button, LinkButton } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icons";
import { Title } from "@/shared/ui/title";

import { canStepForward } from "../model/year-span";

type YearHeaderProps = {
  year: ServiceYear;
  // The service year this person is in. Null is "we do not know" — the
  // zone did not read — and it is not the same as any year: see the
  // arrow below.
  currentYear: ServiceYear | null;
};

// The heading and the two steps beside it, built like the day's and the
// month's and for the same reasons (ADR 0063, 0066): the address carries
// the year, so a step is a navigation, the browser's own back gesture
// walks the years, and LinkButton keeps it client-side with the
// neighbour prefetched.
const ARROW = "size-11 shrink-0 rounded-full p-0 [--press-scale:0.94]";

export const YearHeader = async ({ year, currentYear }: YearHeaderProps) => {
  const t = await getTranslations("screens.year");

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        <Eyebrow>{t("eyebrow")}</Eyebrow>
        {/* Both years, because one of them is otherwise a question: a
            service year runs September to August, and "2026" alone
            leaves the reader working out whether the following spring is
            in it. */}
        <Title>{yearHeading(year)}</Title>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* No floor going back: the database takes any past day, and
            somebody entering years they served before this app existed
            is a person this screen is for (ADR 0062). */}
        <LinkButton
          href={yearPath(year - 1)}
          variant="plain"
          aria-label={t("previousYear")}
          className={ARROW}
        >
          <ChevronLeftIcon size={20} />
        </LinkButton>

        {/* On the current year forward is a button that is there and
            refuses, so the pair never moves. It refuses when the current
            year is UNKNOWN too, the same reading the day and month
            arrows make: a guess from the default calendar runs ahead of
            anybody west of London, and the arrow would offer a year the
            screen turns into a 404 the moment the read recovers. */}
        {canStepForward(year, currentYear)
          ? (
              <LinkButton
                href={yearPath(year + 1)}
                variant="plain"
                aria-label={t("nextYear")}
                className={ARROW}
              >
                <ChevronRightIcon size={20} />
              </LinkButton>
            )
          : (
              <Button
                isDisabled
                variant="plain"
                aria-label={t("nextYear")}
                className={ARROW}
              >
                <ChevronRightIcon size={20} />
              </Button>
            )}
      </div>
    </header>
  );
};
