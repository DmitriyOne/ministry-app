import { getTranslations } from "next-intl/server";

import { addDays, dayHeading, type DayKey, dayPath, formatDayDate } from "@/entities/ministry-day";
import { Button, LinkButton } from "@/shared/ui/button";
import { Eyebrow } from "@/shared/ui/eyebrow";
import { ChevronLeftIcon, ChevronRightIcon } from "@/shared/ui/icons";
import { Title } from "@/shared/ui/title";

type DayHeaderProps = {
  day: DayKey;
  // The day this person is in, in their own calendar. Passed in rather
  // than read here, because the screen has already read it and the
  // heading must agree with the rest of the page about what "today"
  // means.
  today: DayKey;
};

// The heading, and the two steps beside it.
//
// The date is the heading and the weekday sits above it as an eyebrow —
// the owner's design, and the right way round: the date is what names
// the day, while "Tuesday" (or "Today") is how a person recognises it.
// Both arrows are together on the right, where a thumb is.
//
// Here rather than in a slice of its own: FSD v2.1 keeps code where it
// is used until there is real reuse, and this has exactly one user. When
// the calendar wants the same control, that is the moment to extract it
// — not now, on a guess about which shape it will want.
//
// Back is always a step; forward on today is a disabled button, not an
// absent one, so the pair keeps its shape and the dead end is visible.
//
// The arrows are links, not buttons, and that is the whole navigation:
// the address carries the day (ADR 0063), so a step is a navigation and
// the browser's own back gesture walks the days too. LinkButton keeps it
// client-side (ADR 0024) and lets Next prefetch the neighbour, so the
// step lands without a round trip of waiting.
const ARROW = "size-11 shrink-0 rounded-full p-0 [--press-scale:0.94]";
const SPENT_ARROW = `${ARROW} data-disabled:opacity-40`;

export const DayHeader = async ({ day, today }: DayHeaderProps) => {
  const t = await getTranslations("screens.day");
  const heading = dayHeading(day, today);

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* A weekday is formatted data and comes from the domain; "Today"
            and "Yesterday" are interface text and come from the
            dictionary (ADR 0014). */}
        <Eyebrow>{heading.kind === "weekday" ? heading.weekday : t(heading.kind)}</Eyebrow>
        <Title>{formatDayDate(day, today)}</Title>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {/* No floor on how far back this goes (the owner, 2026-10-27):
            the database accepts any past day, and somebody catching up
            on a month they forgot is the person this screen is for. */}
        <LinkButton
          href={dayPath(addDays(day, -1))}
          variant="plain"
          aria-label={t("previousDay")}
          className={ARROW}
        >
          <ChevronLeftIcon size={20} />
        </LinkButton>

        {/* On today, forward is a button that is there and refuses: the
            pair never moves, and the arrow says by looking spent that
            there is nowhere further to go, rather than disappearing and
            leaving a gap to wonder about (the owner, 2026-10-27).
            `data-disabled`, not `disabled` — react-aria sets the aria
            attribute, so `disabled:opacity-50` in button.tsx never
            applies to anything in this project (ADR 0012, the defect).
            The dimming is spelled here for the same reason the hours
            card spells it: the general fix changes every disabled button
            in the app and waits on the owner. */}
        {day < today
          ? (
              <LinkButton
                href={dayPath(addDays(day, 1))}
                variant="plain"
                aria-label={t("nextDay")}
                className={ARROW}
              >
                <ChevronRightIcon size={20} />
              </LinkButton>
            )
          : (
              <Button
                isDisabled
                variant="plain"
                aria-label={t("nextDay")}
                className={SPENT_ARROW}
              >
                <ChevronRightIcon size={20} />
              </Button>
            )}
      </div>
    </header>
  );
};
