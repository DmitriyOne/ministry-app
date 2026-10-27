import { getTranslations } from "next-intl/server";

import { addDays, dayHeading, type DayKey, dayPath, formatDayDate } from "@/entities/ministry-day";
import { LinkButton } from "@/shared/ui/button";
import { Caption } from "@/shared/ui/caption";
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

// The heading, and the two steps either side of it.
//
// Here rather than in a slice of its own: FSD v2.1 keeps code where it
// is used until there is real reuse, and this has exactly one user. When
// the calendar wants the same control, that is the moment to extract it
// — not now, on a guess about which shape it will want.
//
// The arrows are links, not buttons, and that is the whole navigation:
// the address carries the day (ADR 0063), so a step is a navigation and
// the browser's own back button walks the days too. LinkButton keeps it
// client-side (ADR 0024) and lets Next prefetch the neighbour, so the
// step lands without a round trip of waiting.
const ARROW = "size-9.5 shrink-0 rounded-full p-0 [--press-scale:0.94]";

export const DayHeader = async ({ day, today }: DayHeaderProps) => {
  const t = await getTranslations("screens.day");
  const heading = dayHeading(day, today);

  return (
    <header className="flex items-center gap-3">
      {/* No floor on how far back this goes (the owner, 2026-10-27): the
          database accepts any past day, and somebody catching up on a
          month they forgot is the person this screen is for. */}
      <LinkButton
        href={dayPath(addDays(day, -1))}
        variant="plain"
        aria-label={t("previousDay")}
        className={ARROW}
      >
        <ChevronLeftIcon size={18} />
      </LinkButton>

      <div className="min-w-0 flex-1">
        {/* A weekday is formatted data and comes from the domain; "Today"
            and "Yesterday" are interface text and come from the
            dictionary (ADR 0014). */}
        <Title>{heading.kind === "weekday" ? heading.weekday : t(heading.kind)}</Title>
        <Caption>{formatDayDate(day, today)}</Caption>
      </div>

      {/* The slot holds its width with nothing in it, so the heading does
          not shift sideways between today and every other day. Forward
          is not DISABLED on today, it is absent: a day that has not
          happened cannot have been served, and in this project a
          disabled button does not look disabled (DESIGN.md). */}
      <div className={ARROW}>
        {day < today
          ? (
              <LinkButton
                href={dayPath(addDays(day, 1))}
                variant="plain"
                aria-label={t("nextDay")}
                className={ARROW}
              >
                <ChevronRightIcon size={18} />
              </LinkButton>
            )
          : null}
      </div>
    </header>
  );
};
