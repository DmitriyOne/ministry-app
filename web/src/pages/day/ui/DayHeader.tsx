import { getTranslations } from "next-intl/server";

import {
  addDays,
  currentDayKey,
  dayHeading,
  type DayKey,
  dayPath,
  formatDayDate,
} from "@/entities/ministry-day";
import { DEFAULT_TIME_ZONE } from "@/shared/lib/time-zone";
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
  //
  // NULL is "we do not know", and it is a different answer from any
  // date: the person's calendar is a row in the database, so a failed
  // read leaves today genuinely unknown. The two things this value is
  // asked for then part company — see each of them below.
  today: DayKey | null;
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

export const DayHeader = async ({ day, today }: DayHeaderProps) => {
  const t = await getTranslations("screens.day");
  // What the day is CALLED falls back to the default calendar when today
  // is unknown: a label a few hours out is a label, and no card is drawn
  // against it to record anything (ADR 0063, decision 12).
  //
  // DEFAULT_TIME_ZONE by name rather than the null that currentDayKey
  // also accepts for it: `today ?? currentDayKey(null)` put two
  // different nulls in one line — "we do not know today" and "we do not
  // know the zone" — reading as though they were one thing.
  const named = today ?? currentDayKey(DEFAULT_TIME_ZONE);
  const heading = dayHeading(day, named);

  return (
    <header className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* A weekday is formatted data and comes from the domain; "Today"
            and "Yesterday" are interface text and come from the
            dictionary (ADR 0014). */}
        <Eyebrow>{heading.kind === "weekday" ? heading.weekday : t(heading.kind)}</Eyebrow>
        <Title>{formatDayDate(day, named)}</Title>
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
            Nothing is said here about how a disabled button looks:
            button.tsx dims it and takes it out of reach of a thumb
            (ADR 0012, fixed app-wide 2026-10-28). That second half
            matters on this one — `variant="plain"` carries
            `.pressable`, and its `:active` would otherwise squeeze a
            dead arrow exactly as if it had stepped.

            Today being UNKNOWN disables it too, and that is not the same
            use of this value as the label above: stepping forward on a
            guess walks onto a day the person has not lived yet. The
            default calendar is Europe/London, so for anybody west of it
            the guess runs a day ahead of them — and the arrow would
            offer a day that the screen turns into a 404 the moment the
            read recovers. A label a few hours out costs a word; a step
            costs the screen. Found on review of 2.3. */}
        {today !== null && day < today
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
                className={ARROW}
              >
                <ChevronRightIcon size={20} />
              </Button>
            )}
      </div>
    </header>
  );
};
