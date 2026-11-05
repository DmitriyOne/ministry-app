import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { currentDayKey, parseDayKey } from "@/entities/ministry-day";
import { getSessionClaims } from "@/entities/session";
import { DayHoursProvider, HoursCard } from "@/features/hours-entry";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { WelcomeToast } from "@/features/welcome-toast";
import { routes } from "@/shared/config";
import { readDayPage } from "../api/read-day-page";
import { monthOfDay } from "../model/progress-span";
import { DayHeader } from "./DayHeader";
import { DayLastDays } from "./DayLastDays";
import { DayProgress } from "./DayProgress";
import { DayScreenFrame } from "./DayScreenFrame";
import { RefreshOnDayChange } from "./RefreshOnDayChange";
import { RememberTimeZone } from "./RememberTimeZone";
import { DayClosedNotice } from "./DayClosedNotice";

// Next hands the segment as a promise (15+), so it is awaited rather
// than read.
type DayPageProps = {
  params: Promise<{ day: string }>;
};

// The day screen. The hours card on it now keeps what it is given (ADR
// 0062) — until 2.3 it kept nothing and a reload cleared it (ADR 0060) —
// so this screen has a read of its own, and with it a loading boundary
// (DayScreenSkeleton).
//
// The screen itself stays a server component; the card is the only
// client island on it, the same arrangement the forms use.
//
// WelcomeToast stays: it is what greets someone by name right after they
// sign in (ADR 0046), and /day is where the gate sends them.
export const DayPage = async ({ params }: DayPageProps) => {
  const day = parseDayKey((await params).day);

  // The boundary. Anything that is not an ISO date — and that includes
  // the shapes close enough to be dangerous, like 2026-02-30 — is not
  // this app's address at all.
  if (!day) notFound();

  // proxy.ts already keeps this screen behind a session, so this should
  // be unreachable — except that DEV_MODE switches proxy off entirely
  // (CLAUDE.md), and that is exactly where it was met: with no session
  // the reads below run as `anon`, the database answers "permission
  // denied for table profiles", and the screen drew "could not load" at
  // somebody who simply was not signed in. /profile has had this line
  // since ADR 0044 and redirected correctly, which is why only this
  // screen got it wrong (the owner, 2026-10-28).
  if (!await getSessionClaims()) redirect(routes.login);

  const page = await readDayPage(day);

  // A day that has not happened cannot have been served, and the only
  // way to ask for one is to type it: the forward arrow is disabled on
  // today. Decided after the read, because it takes the person's own
  // calendar to know what "future" means — and if we could not read
  // that, we do not know, so the failure below speaks instead of a 404.
  if (page.status === "ready" && day > currentDayKey(page.timeZone)) notFound();

  const t = await getTranslations("screens.day");
  // Null rather than a guess when the read failed: the heading falls back
  // to the default calendar itself, while the forward arrow stays out of
  // reach. Both halves used to come from one guessed date, and the arrow
  // then offered a day the person had not lived yet (found on review of
  // 2.3).
  const today = page.status === "ready" ? currentDayKey(page.timeZone) : null;

  return (
    <DayScreenFrame
      heading={(
        <>
          <WelcomeToast />
          {/* "Today" is relative, so a screen left open past midnight
              would go on saying it. This asks the server for the screen
              again once the date has turned over — which is where the
              card's own midnight check went (ADR 0063). */}
          <RefreshOnDayChange />
          {/* Writes this person's zone down on the device, so the menu
              can link to today's date and skip the redirect at /day.
              Only when the read succeeded: the fallback above is a
              calendar nobody confirmed, and a guess written down would
              be believed by every later navigation. */}
          {page.status === "ready" ? <RememberTimeZone timeZone={page.timeZone} /> : null}
          {/* The zone is unknown when the read failed, so the heading
              falls back to the default calendar. It may then name the
              wrong day by a few hours — but it is a LABEL, and no card
              is drawn to write against it, so nothing can be recorded
              in the wrong place. The arrow forward is the half of this
              that is NOT a label, which is why today arrives as null
              here rather than as that fallback. */}
          <DayHeader day={day} today={today} />
        </>
      )}
    >

      {/* A card is drawn only when we know what the day holds. The read
          having failed is not the same as a day with nothing on it: a
          card opened at zero would let one tap overwrite hours somebody
          really served, and this is the one place on the screen where
          guessing would cost data rather than looks. */}
      {page.status === "unavailable"
        ? (
            // The failure wears the card's own shape and sits where the
            // card would be, so the screen does not change outline once
            // the hours arrive (the owner, 2026-10-26).
            <ScreenLoadFailure
              eyebrow={t("hours.label")}
              title={t("loadFailure.title")}
              text={t("loadFailure.text")}
            />
          )
        : (
            // Keyed by the day: the hours are read once, at mount, and
            // from then on the taps are the truth about the number.
            // Another day has to be another mount, or the card would
            // open on Tuesday showing Monday's total. The key sits on
            // the provider because that is where the state is (ADR
            // 0065) — it used to sit on the card, which held it.
            //
            // The provider wraps all three blocks, not just the card:
            // the strip's chip for the open day shows the same number,
            // and these are server components passed through as
            // children — being inside it makes none of them client.
            <DayHoursProvider
              key={day}
              day={day}
              savedMinutes={page.savedMinutes}
              isReadOnly={page.isMonthClosed}
            >
              {/* Above the card, because it explains why the card does
                  not answer. It says which month and links to it —
                  reopening lives there, and a second way to do it here
                  would be a second place to keep in step. */}
              {page.isMonthClosed
                ? (
                    <DayClosedNotice month={monthOfDay(day)} />
                  )
                : null}

              <HoursCard />

              {/* Drawn only when all four of its reads answered (ADR
                  0064): a bar is a fraction, and a fraction with one
                  number missing is wrong rather than incomplete.
                  Nothing stands in its place — unlike the card, this
                  block is not what the person came to change, and an
                  apology where the month's figure belongs would be
                  louder than the figure. */}
              {page.progress !== null ? <DayProgress progress={page.progress} /> : null}

              {/* Same rule, same reason (ADR 0065): a strip missing a
                  chip would say "nothing recorded" about a day that may
                  hold hours, and that is read as an invitation to fill
                  it in. */}
              {page.previousDays !== null
                ? <DayLastDays openDay={day} days={page.previousDays} />
                : null}
            </DayHoursProvider>
          )}
    </DayScreenFrame>
  );
};
