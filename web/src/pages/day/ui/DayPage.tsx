import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { currentDayKey, parseDayKey } from "@/entities/ministry-day";
import { HoursCard } from "@/features/hours-entry";
import { ScreenLoadFailure } from "@/features/screen-retry";
import { WelcomeToast } from "@/features/welcome-toast";
import { Title } from "@/shared/ui/title";

import { readDayPage } from "../api/read-day-page";
import { DayScreenFrame } from "./DayScreenFrame";

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
  const t = await getTranslations("screens.day");
  const day = parseDayKey((await params).day);

  // The boundary. Anything that is not an ISO date — and that includes
  // the shapes close enough to be dangerous, like 2026-02-30 — is not
  // this app's address at all.
  if (!day) notFound();

  const page = await readDayPage(day);

  // A day that has not happened cannot have been served, and the only
  // way to ask for one is to type it: the forward arrow is not drawn on
  // today. Decided after the read, because it takes the person's own
  // calendar to know what "future" means — and if we could not read
  // that, we do not know, so the failure below speaks instead of a 404.
  if (page.status === "ready" && day > currentDayKey(page.timeZone)) notFound();

  return (
    <DayScreenFrame
      heading={(
        <>
          <WelcomeToast />
          <Title>{t("title")}</Title>
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
            // Keyed by the day: the card reads what the database holds
            // once, at mount, and from then on the taps are the truth
            // about the number. Another day has to be another mount, or
            // the card would open on Tuesday showing Monday's total.
            <HoursCard
              key={day}
              day={day}
              savedMinutes={page.savedMinutes}
              timeZone={page.timeZone}
            />
          )}
    </DayScreenFrame>
  );
};
